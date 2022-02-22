import BaseCommand, { CommandContext, processDeployments } from "../baseCommand";

export default class TeardownCommand extends BaseCommand<typeof TeardownCommand.flags> {
    static description = "tears down instances from the current environment";
    static strict = false;

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(ctx: CommandContext<typeof TeardownCommand.flags>) {
        await ctx.handleAuth();

        await processDeployments(ctx,
            chart => chart.uninstall(), true);
    }
}
