import { Flags } from "./flags";
import { CommandInput } from './baseCommand';
import { Konfiguration } from "./konfiguration";
import { initDtShell, InteractiveShell } from "./shell";
import { HelmChart, helmClient } from "./helm";
import Logger from "./logger";
import { CommandContext } from "./commandContext";

export async function processDeployments<T extends Flags>(ctx: CommandContext<T>, chartHandler: (chart: HelmChart<T>) => Promise<void>, skipRepoUpdate?: boolean,) {
    const { env, input } = ctx;
    
    const deployments = env.konfig.filterDeployments<T>(input);

    if(deployments.length == 0) {
        Logger.root.info("No deployments configured, nothing to do. Exiting!")
        return;
    }

    // TODO: check if helm charts present
    if(!input.flags.testing && !skipRepoUpdate)
        await helmClient.updateHelmRepos(ctx);

    const envValues = {
        region: env.konfig?.environment.awsRegion,
        nodegroup: env.konfig?.environment.eksNodegroup,
        nodeSelector: {
            "eks.amazonaws.com/nodegroup": env.konfig?.environment.eksNodegroup
        }
    };
    Logger.root.debug("Env values:")
    Logger.root.debugYaml(envValues);

    await Promise.all(deployments
        .map(entry =>
            new HelmChart(...entry, envValues, ctx))
        .map(chartHandler));
};
