import { Deployment, ValuesMap } from "./konfiguration";
import { prettyPrintYaml } from "./util";
import { Flags } from "./flags";
import { Environment } from "./common";
import { CommandInput } from "./baseCommand";

import * as tmp from "tmp-promise";
import * as fs from "fs-extra";
import { InteractiveShell } from "./shell";

export async function runHelmCommand(shell: InteractiveShell, dryrun: boolean, ...helmArgs: string[]) {
    const fullCommand = `helm ${helmArgs.join(' ')}`;

    console.log("Running helm command...")
    if(dryrun) {
        console.log(fullCommand);
        return;
    }

    const { exitcode } = await shell.runCommand(`${fullCommand} 2>&1`);
    if(exitcode != 0) {
        console.log(`Helm command failed with error code ${exitcode}!`);
        process.exit(1);
    }
};

export async function updateHelmRepos(shell: InteractiveShell, dryrun: boolean) {
    console.log(`\nUpdating repositories...`)

    return runHelmCommand(shell, dryrun, "repo", "update");
}

export class HelmChart<T extends Flags> {
    constructor(private name: string, private dep: Deployment, private envValues: ValuesMap, private env: Environment, private input: CommandInput<T>) {
        console.log(prettyPrintYaml(dep))
    }
    
    async runChartCommand(commandArgs: string[], ...extraArgs: string[]) {
        const { k8sContext, k8sNamespace } = this.env.konfig.environment;
        const helmArgs = [...commandArgs,
            "--kube-context", k8sContext, "--namespace", k8sNamespace,
            this.name, ...extraArgs];

        return runHelmCommand(this.env.shell, this.input.flags.dryrun, ...helmArgs);
    }
    
    async runChartValuesCommand(...commandArgs: string[]) {
        const valueArgs = await this.prepareValues();

        const { chart, source, version } = this.dep;
        const versionArg = !version ? '' : `--version=${version}`;
        const chartArg = source == "local" ? chart : `fimbulvetr/${chart}`;
        
        this.runChartCommand(commandArgs, chartArg, versionArg, ...valueArgs)
    }

    async render() {
        console.log(`\nRendering ${this.name}...`)

        return this.runChartValuesCommand("template");
    }
    
    async deploy() {
        console.log(`\nDeploying ${this.name}...`)

        return this.runChartValuesCommand("upgrade", "--install");
    }
    
    async uninstall() {
        console.log(`\nUninstalling ${this.name}...`)

        return this.runChartCommand(["uninstall"]);
    }

    async show() {
        return this.runChartValuesCommand("show");
    }

    async prepareValues() {
        const chartDefaultValues = this.env.konfig.readChartDefaultValues(this.dep.chart);
        const deploymentValues = this.env.konfig.readDeploymentValues(this.name);

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
            this.env.konfig.getChartDefaults(this.dep.chart)?.values || {},
            await deploymentValues,
            this.dep.values || {},
        ];

        console.debug("Writing values files...")
        const valueFiles = await Promise.all([
            ...values
                .filter(x => Object.keys(x).length !== 0)
                .map(writeValueFile)
        ]);

        return valueFiles.map(x => ["-f", x]).flat()
    }
}

async function writeValueFile(values: object) {
    const { fd, path, cleanup } = await tmp.file({ template: 'tmp-XXXXXX.json' });

    console.debug(`Writing values file ${path}...`)
    console.log(prettyPrintYaml(values));

    const { bytesWritten, buffer } = await fs.write(fd, Buffer.from(JSON.stringify(values)))

    return path;
}
