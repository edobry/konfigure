import { CommandContext } from "./commandContext";
import { Flags } from "./flags";
import { HelmChart, HelmClient, helmClient as rootHelmClient, IHelmClient } from "./helm";
import Logger from "./logger";

export async function processDeployments<T extends Flags>(
    ctx: CommandContext<T>,
    chartHandler: (chart: HelmChart<T>) => Promise<any>,
    skipRepoUpdate?: boolean,
    helmClient?: IHelmClient
) {
    const { env, input } = ctx;

    const instances = env.konfig.filterDeployments<T>(input);

    if(instances.length == 0) {
        Logger.root.info("No deployments configured, nothing to do. Exiting!");
        return;
    }

    const remoteHelmChartsPresent = instances.some(([n, i]) =>
        i.type == "helm" &&
        i.source == "remote");

    if(!input.flags.testing && !skipRepoUpdate && remoteHelmChartsPresent)
        await(helmClient ?? rootHelmClient).updateHelmRepos(ctx);

    const envValues = {
        region: env.konfig?.environment.awsRegion,
        nodegroup: env.konfig?.environment.eksNodegroup,
        nodeSelector: {
            "eks.amazonaws.com/nodegroup": env.konfig?.environment.eksNodegroup,
        },
    };
    Logger.root.debug("Env values:");
    Logger.root.debugYaml(envValues);

    await Promise.all(
        instances
            .map((instance) => new HelmChart<T>(...instance, envValues, ctx))
            .map(chartHandler)
    );
};
