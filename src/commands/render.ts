import { Command, flags } from '@oclif/command'
import * as tmp from "tmp-promise";
import * as fs from "fs-extra";
import { $, ProcessOutput } from 'zx'

import { commonFlags, dryrun, envArg, instanceArg } from '../flags';
import { Deployment, Konfiguration, ValuesMap } from '../konfiguration';
import { prettyPrintYaml } from '../util';

// adapted from https://github.com/highlightjs/highlight.js/blob/main/src/styles/obsidian.css

export default class Render extends Command {
    static description = "render instance manifests";

    static flags = {
       ...commonFlags
    }
    
    static strict = false
    static args = [envArg, instanceArg]

    async run() {
        const { argv, flags: {
          dryrun, testing, auth, debug
        }} = this.parse(Render)

        if(dryrun)
            this.log("-- DRYRUN MODE --")
        if(testing)
            this.log("-- TESTING MODE --")
        if(auth)
            this.log("-- AUTH MODE --")
        if(debug)
            this.log("-- DEBUG MODE --")

        this.log("-- RENDER MODE --");

        const konfig = await Konfiguration.read(argv[0]);
        this.log(konfig.header())
        this.log()

        const deployments = konfig.filterDeployments(argv.slice(1));
        if(deployments.length == 0) {
            this.log("No deployments configured, nothing to do. Exiting!")
            return;
        }

        this.log("\nEnv values:")
        const envValues = {
            region: konfig?.environment.awsRegion,
            nodegroup: konfig?.environment.eksNodegroup,
            nodeSelector: {
                "eks.amazonaws.com/nodegroup": konfig?.environment.eksNodegroup
            }
        };

        this.log(prettyPrintYaml(envValues));

        deployments.forEach(([name, dep]) =>
            this.renderDeployment(name, dep, envValues, konfig));
    }

    async renderDeployment(name: string, dep: Deployment, envValues: ValuesMap, konfig: Konfiguration) {
        this.log(`\nRendering ${name}...`)
        // this.log(deploymentToString(name, dep));

        const { chart } = dep;

        this.log(prettyPrintYaml(dep))

        const chartDefaultValues = konfig.readChartDefaultValues(dep.chart);
        const deploymentValues = konfig.readDeploymentValues(name);

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
            envValues,
            await chartDefaultValues,
            konfig.getChartDefaults(chart)?.values || {},
            await deploymentValues,
            dep.values || {},
        ];

        this.debug("Writing values files...")
        const valueFiles = await Promise.all([
            ...values
                .filter(x => Object.keys(x).length !== 0)
                .map(writeValueFile)
        ]);

        const valueArgs = valueFiles.map(x => ["-f", x]).flat()

        const versionArg = !dep.version ? '' : `--version=${dep.version} `
        
        const chartArg = dep.source == "local" ? dep.chart : `fimbulvetr/${dep.chart}`

        const helmArgs = ["template", name, chartArg, versionArg, ...valueArgs];

        // this.log(`\nhelm ${helmArgs}`)

        this.log("Running helm command...")
        try {
            if(dryrun)
                console.log(`helm ${helmArgs}`);
            else {
                $.verbose = false;
                const result = await $`helm ${helmArgs}`.pipe(process.stdout)
                
                this.log(`result: ${result}`)
            }
        } catch(e) {
            const { exitCode, stdout, stderr } = e as ProcessOutput

            this.log(`Helm command failed with error code ${exitCode}!`);
            this.log(`${stdout}${stderr}`)
        }
        
        // const { stdout, stderr } = await pExec(helmArgs);
        // console.log('stdout:', stdout);
        // console.log('stderr:', stderr);

    }
}

async function writeValueFile(values: object) {
    const { fd, path, cleanup } = await tmp.file({ template: 'tmp-XXXXXX.json' });

    console.debug(`Writing values file ${path}...`)
    console.log(prettyPrintYaml(values));

    const { bytesWritten, buffer } = await fs.write(fd, Buffer.from(JSON.stringify(values)))

    return path;
}
