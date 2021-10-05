import { Flags } from './flags';
import { Konfiguration } from './konfiguration';
import { prettyPrintYaml } from './util';
import { HelmChart } from './helm';

export interface CommandInput {
    flags: Flags;
    argv: string[];
}

export async function initEnv({ argv }: CommandInput) {
    const konfig = await Konfiguration.read(argv[0]);

    console.log(konfig.header())
    console.log()

    return konfig;
};

export async function processDeployments(input: CommandInput, konfig: Konfiguration, chartHandler: (chart: HelmChart) => Promise<void>) {
    const deployments = konfig.filterDeployments(input.argv.slice(1));

    if(deployments.length == 0) {
        console.log("No deployments configured, nothing to do. Exiting!")
        return;
    }

    console.log("\nEnv values:")
    const envValues = {
        region: konfig?.environment.awsRegion,
        nodegroup: konfig?.environment.eksNodegroup,
        nodeSelector: {
            "eks.amazonaws.com/nodegroup": konfig?.environment.eksNodegroup
        }
    };

    console.log(prettyPrintYaml(envValues));

    deployments
        .map(entry =>
            new HelmChart(...entry, envValues, konfig, input))
        .forEach(chartHandler);
};
