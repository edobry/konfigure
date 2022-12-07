import BaseCommand, { CommandContext, processDeployments } from "../baseCommand";

export default class RedeployCommand extends BaseCommand<typeof RedeployCommand.flags> {
    static description = "`teardown` and then `deploy` targeted instances to the current environment";
    static strict = false;

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(ctx: CommandContext<typeof RedeployCommand.flags>) {
        await ctx.handleAuth();

        await processDeployments(ctx,
            async chart => {
                await chart.uninstall();
                return chart.deploy();
            });
    }
};
