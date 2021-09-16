import { Command, flags } from '@oclif/command'
import * as tmp from "tmp-promise";

import { commonFlags, envArg, instanceArg } from '../flags';
import { Deployment, deploymentToString, Konfiguration } from '../konfiguration';
import { readKonfig } from '../util';

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

        const konfig = readKonfig(argv[0]);
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

        this.log(JSON.stringify(envValues, null, 4))

        deployments.forEach(([name, dep]) =>
            this.renderDeployment(name, dep, envValues, konfig));
    }

    renderDeployment(name: string, dep: Deployment, envValues: object, konfig: Konfiguration): void {
        this.log(`\nRendering ${name}...`)
        // this.log(deploymentToString(name, dep));

        const { chart } = dep;

        this.log(JSON.stringify(dep, null, 4))

        const values: object[] = [
            konfig.getChartDefaults(chart)?.values || {},
            dep.values || {},
            envValues
        ];

        const valueFiles = [
            ...values.map(writeValueFile)
        ];

        const valueArgs = valueFiles.map(x => `-f ${x}`).join(' ')

        const versionArg = !dep.version ? '' : `--version=${dep.version} `

        const helmCommand = `helm template ${name} ${dep.chart} ${versionArg}${valueArgs}`

        this.log(`\n${helmCommand}`)
    }
}

function writeValueFile(values: object) {
    return tmp.tmpNameSync({ template: 'tmp-XXXXXX.json' })
}

// async function writeValueFile(values: object) {
//     const { fd, path, cleanup } = await tmp.file();

//     return
// }
