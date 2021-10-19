import { Deployment, ValuesMap } from "./konfiguration";
import { prettyPrintYaml } from "./util";
import { Flags } from "./flags";
import { Environment } from "./common";
import { CommandInput } from "./baseCommand";

import * as tmp from "tmp-promise";
import * as fs from "fs-extra";

export class HelmChart<T extends Flags> {
    private versionArg: string;
    private chartArg: string;

    constructor(private name: string, private dep: Deployment, private envValues: ValuesMap, private env: Environment, private input: CommandInput<T>) {
        const { chart, version, source } = dep;

        console.log(prettyPrintYaml(dep))

        this.versionArg = !version ? '' : `--version=${version}`;
        this.chartArg = source == "local" ? chart : `fimbulvetr/${chart}`;
    }

    async runCommand(command: string, ...args: string[]) {
        const valueArgs = await this.prepareValues();
        const helmArgs = [command, ...args, this.name, this.chartArg, this.versionArg, ...valueArgs];

        console.log("Running helm command...")
        if(this.input.flags.dryrun) {
            console.log(`helm ${helmArgs.join(' ')}`);
            return;
        }

        const { exitcode, output } = await this.env.shell.runCommand(`helm ${helmArgs.join(' ')}`);
        
        if(exitcode != 0) {
            console.log(`Helm command failed with error code ${exitcode}!`);
            console.log(`${output}`)
        }
    }


    async render() {
        console.log(`\nRendering ${this.name}...`)

        return this.runCommand("template");
    }
    
    async deploy() {
        console.log(`\Deploying ${this.name}...`)

        return this.runCommand("upgrade", "--install");
    }

    async show() {
        return this.runCommand("show");
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
