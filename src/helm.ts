import { Deployment, ValuesMap } from "./konfiguration";
import { Flags } from "./flags";

import * as tmp from "tmp-promise";
import * as fs from "fs-extra";
import { InteractiveShell } from "./shell";
import Logger from "./logger";
import { CommandContext } from "./commandContext";

const helmLogger = new Logger("Helm");

export async function runHelmCommand(shell: InteractiveShell, dryrun: boolean, ...helmArgs: string[]) {
    const fullCommand = `helm ${helmArgs.join(' ')}`;
    
    Logger.root.debugBlank();
    helmLogger.debug("Running helm command...")
    if(dryrun) {
        helmLogger.info(`dryrun: ${fullCommand}`);
        return;
    }

    const { exitcode } = await shell.runCommand(`${fullCommand} 2>&1`);
    if(exitcode != 0) {
        helmLogger.error(`Helm command failed with error code ${exitcode}!`);
        process.exit(1);
    }
};

export async function updateHelmRepos(shell: InteractiveShell, dryrun:  boolean) {
    Logger.root.infoBlank();
    helmLogger.info(`Updating repositories...`)

    return runHelmCommand(shell, dryrun, "repo", "update");
}

export class HelmChart<T extends Flags> {
    private log: Logger;
    constructor(private name: string, private dep: Deployment, private envValues: ValuesMap, private ctx: CommandContext<T>) {
        this.log = new Logger(`${dep.chart}/${name}`);
        this.log.debugYaml(dep);
    }
    
    async runChartCommand(commandArgs: string[], ...extraArgs: string[]) {
        const { k8sContext, k8sNamespace } = this.ctx.env.konfig.environment;
        const helmArgs = [...commandArgs,
            "--kube-context", k8sContext, "--namespace", k8sNamespace,
            this.name, ...extraArgs];

        return runHelmCommand(this.ctx.env.shell, this.ctx.input.flags.dryrun, ...helmArgs);
    }
    
    async runChartValuesCommand(...commandArgs: string[]) {
        const valueArgs = await this.prepareValues();

        const { chart, source, version } = this.dep;
        const versionArg = !version ? '' : `--version=${version}`;
        const chartArg = source == "local" ? chart : `fimbulvetr/${chart}`;
        
        return this.runChartCommand(commandArgs, chartArg, versionArg, ...valueArgs)
    }

    async render() {
        Logger.root.infoBlank();
        this.log.info(`Rendering ${this.name}...`)

        return this.runChartValuesCommand("template");
    }
    
    async deploy() {
        Logger.root.infoBlank();
        this.log.info(`Deploying ${this.name}...`)

        return this.runChartValuesCommand("upgrade", "--install");
    }
    
    async uninstall() {
        Logger.root.infoBlank();
        this.log.info(`Uninstalling ${this.name}...`)

        return this.runChartCommand(["uninstall"]);
    }

    async show() {
        return this.runChartValuesCommand("show");
    }

    async prepareValues() {
        const chartDefaultValues = this.ctx.env.konfig.readChartDefaultValues(this.dep.chart);
        const deploymentValues = this.ctx.env.konfig.readDeploymentValues(this.name);

        // TODO: implement unit test
        // precedence order
        //
        // chart default
        //
        // per env chart default (file)
        // per env chart default (inline)
        // deployment (file)
        // deployment (inline)

        const values: ValuesMap[] = [
            this.envValues,
            await chartDefaultValues,
            this.ctx.env.konfig.getChartDefaults(this.dep.chart)?.values || {},
            await deploymentValues,
            this.dep.values || {},
        ];

        this.log.debug("Writing values files...")
        const valueFiles = await Promise.all([
            ...values
                .filter(x => Object.keys(x).length !== 0)
                .map(this.writeValueFile.bind(this))
        ]);

        return valueFiles.map(x => ["-f", x]).flat()
    }

    async writeValueFile(values: object) {
        const { fd, path, cleanup } = await tmp.file({ template: 'tmp-XXXXXX.json' });

        this.log.debug(`Writing values file ${path}...`)
        this.log.debugYaml(values);

        const { bytesWritten, buffer } = await fs.write(fd, Buffer.from(JSON.stringify(values)))

        return path;
    }
}
