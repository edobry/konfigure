import { Flags } from "./flags";
import { CommandInput } from './baseCommand';
import { Konfiguration } from "./konfiguration";
import { initDtShell, InteractiveShell } from "./shell";
import { HelmChart, helmClient } from "./helm";
import Logger from "./logger";
import { CommandContext } from "./commandContext";

export async function processDeployments<T extends Flags>(ctx: CommandContext<T>, chartHandler: (chart: HelmChart<T>) => Promise<void>, skipRepoUpdate?: boolean,) {
    const deployments = ctx.env.konfig.filterDeployments<T>(ctx.input);

    if(deployments.length == 0) {
        Logger.root.info("No deployments configured, nothing to do. Exiting!")
        return;
    }

    // TODO: check if helm charts present
    if(!ctx.input.flags.testing && !skipRepoUpdate)
        helmClient.updateHelmRepos(ctx.env.shell, ctx.input.flags.dryrun);

    const envValues = {
        region: ctx.env.konfig?.environment.awsRegion,
        nodegroup: ctx.env.konfig?.environment.eksNodegroup,
        nodeSelector: {
            "eks.amazonaws.com/nodegroup": ctx.env.konfig?.environment.eksNodegroup
        }
    };
    Logger.root.debug("Env values:")
    Logger.root.debugYaml(envValues);

    await Promise.all(deployments
        .map(entry =>
            new HelmChart(...entry, envValues, ctx))
        .map(chartHandler));
};
