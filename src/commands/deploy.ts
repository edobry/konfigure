import BaseCommand, { processDeployments, CommandContext } from "../baseCommand";

export default class DeployCommand extends BaseCommand<typeof DeployCommand.flags> {
    static description = "render and deploy targeted instances to the current environment";
    static strict = false;

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(ctx: CommandContext<typeof DeployCommand.flags>) {
        await ctx.handleAuth();
        await ctx.initNamespace();

        await processDeployments(ctx,
            chart => chart.deploy());
    }
}
