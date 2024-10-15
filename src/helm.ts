import { basename } from "path";
import * as fs from "fs-extra";
import * as dir from "node-dir";
import * as tmp from "tmp-promise";
import { CommandContext } from "./commandContext";
import { Flags } from "./flags";
import { Deployment, Instance, ValuesMap } from "./konfiguration";

import Logger from "./logger";
import { ShellCommandRunner } from "./shell";
import { fromEntries } from "./util";

export interface IHelmClient {
    runHelmCommand: HelmClient["runHelmCommand"];
    updateHelmRepos: HelmClient["updateHelmRepos"];
}
export class HelmClient implements IHelmClient {
    private log: Logger;

    constructor() {
        this.log = new Logger(this.constructor.name);
    }

    async runHelmCommand(shell: ShellCommandRunner, dryrun: boolean, debug: boolean, ...helmArgs: string[]) {
        const fullCommand = `helm ${debug ? "--debug " : ""}${helmArgs.join(" ")}`;

        this.log.debugBlank();
        this.log.debug("Running helm command...");
        this.log.debug(fullCommand);
        if(dryrun) {
            this.log.info(`dryrun: ${fullCommand}`);
            return;
        }

        const { exitcode, output } = await shell.runCommand(`${fullCommand} 2>&1`);
        if(exitcode != 0) {
            this.log.error(`Helm command failed with error code ${exitcode}!`);
            process.exit(1);
        }
    }

    async updateHelmRepos<T extends Flags>({ env, input }: CommandContext<T>) {
        this.log.infoBlank();
        this.log.info("Updating repositories...");

        return this.runHelmCommand(env.shell, input.flags.dryrun, input.flags.debug, "repo", "update");
    }
}

export const helmClient = new HelmClient();

export class HelmChart<T extends Flags> {
    private log: Logger;
    private client: IHelmClient;

    constructor(
        private name: string,
        private instance: Instance,
        private envValues: ValuesMap,
        private ctx: CommandContext<T>,
        client?: IHelmClient
    ) {
        this.log = new Logger(`${instance.chart}/${name}`);
        this.client = client || helmClient;
    }

    async runChartCommand(commandArgs: string[], ...extraArgs: string[]) {
        const { k8sContext, k8sNamespace } = this.ctx.env.konfig.environment;

        const helmArgs = [
            ...commandArgs,
            "--kube-context",
            k8sContext,
            "--namespace",
            k8sNamespace,
            this.name,
            ...extraArgs,
        ].filter((x) => x);

        return this.client.runHelmCommand(
            this.ctx.env.shell,
            this.ctx.input.flags.dryrun,
            this.ctx.input.flags.debug,
            ...helmArgs
        );
    }

    async runChartValuesCommand(...commandArgs: string[]) {
        const valueArgs = await this.writeValueFiles();

        const {
            chartPath,
            dep: { source, version },
        } = this.instance;
        const versionArg = !version ? "" : `--version=${version}`;
        const chartArg = source == "local" ? chartPath : `fimbulvetr/${chartPath}`;

        return this.runChartCommand(
            commandArgs,
            chartArg,
            versionArg,
            ...valueArgs
        );
    }

    async render() {
        this.log.infoBlank();
        this.log.info(`Rendering ${this.name}...`);

        const { path, cleanup } = await tmp.dir({
            template: "tmp-helm-XXXXXX",
            unsafeCleanup: true,
        });

        await this.runChartValuesCommand("template", `--output-dir ${path}`);

        this.log.debug(`Reading output directory ${path}`);
        const outputDir = `${path}/${basename(this.instance.chart)}`;
        const filenames = await dir.promiseFiles(outputDir);
        const files = fromEntries(
            await Promise.all(
                filenames.map(async (x) =>
                    [x, await fs.readFile(x, "utf-8")] as [string, string])
            )
        );
        await cleanup();

        Object.entries(files).forEach(([name, file]) => {
            this.log.info(`Rendered manifest ${name.replace(`${outputDir}/`, "")}:`);
            this.log.info(file);
        });
    }

    async deploy() {
        this.log.infoBlank();
        this.log.info(`Deploying ${this.name}...`);

        return this.runChartValuesCommand("upgrade", "--install");
    }

    async uninstall() {
        this.log.infoBlank();
        this.log.info(`Uninstalling ${this.name}...`);

        return this.runChartCommand(["uninstall"]);
    }

    async show() {
        return this.runChartValuesCommand("show");
    }

    async writeValueFiles() {
        const values = await this.instance.prepareValues(this.envValues);

        this.log.debug("Writing values files...");
        const valueFiles = await Promise.all([
            ...values
                .filter((x) => Object.keys(x).length !== 0)
                .map(this.writeValueFile.bind(this)),
        ]);

        return valueFiles.map((x) => ["-f", x]).flat();
    }

    async writeValueFile(values: object) {
        const { fd, path, cleanup } = await tmp.file({
            template: "tmp-XXXXXX.json",
        });

        this.log.debug(`Writing values file ${path}...`);
        this.log.debugYaml(values);

        const { bytesWritten, buffer } = await fs.write(
            fd,
            Buffer.from(JSON.stringify(values))
        );
        // await cleanup();

        return path;
    }
}
