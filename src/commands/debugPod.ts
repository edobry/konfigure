import { Flags } from "@oclif/core";
import BaseCommand, { CommandContext, runChiCommand } from "../baseCommand";

export default class DebugPodCommand extends BaseCommand<typeof DebugPodCommand.flags> {
    static description = "launches a `debugPod` configured with the specified environment";
    static strict = false;

    static flags = {
        ...BaseCommand.flags,
        serviceAccount: Flags.string({
            description: "which service account to run as"
        })
    };
    static args = BaseCommand.args;

    async command(ctx: CommandContext<typeof DebugPodCommand.flags>) {
        const { env: { konfig: { environment: { awsRegion } } }, input } = ctx;
        await ctx.handleAuth();

        const args = [];
        if(input.flags.serviceAccount)
            args.push("--serviceAccount", input.flags.serviceAccount);

        const debugPodCommand = `k8sDebugPod --az ${awsRegion}a ${args.join(" ")}`;
        if(input.flags.dryrun)
            this.logger.info(debugPodCommand);
        else
            await runChiCommand(debugPodCommand);
    }
};
