import { CommandContext } from "./commandContext.ts";
import { Args, Flags } from "./flags.ts";
import {
    HelmChart,
    HelmClient,
    helmClient as rootHelmClient,
    IHelmClient,
} from "./helm.ts";
import Logger from "./logger.ts";

export async function processDeployments<F extends Flags, A extends Args>(
    ctx: CommandContext<F, A>,
    chartHandler: (chart: HelmChart<F, A>) => Promise<any>,
    skipRepoUpdate?: boolean,
    helmClient?: IHelmClient
) {
    const { env, input } = ctx;

    const instances = env.konfig.filterDeployments<F, A>(input);

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
            .map((instance) => new HelmChart<F, A>(...instance, envValues, ctx))
            .map(chartHandler)
    );
};
