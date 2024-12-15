import BaseCommand, { processDeployments, CommandContext } from "../baseCommand.ts";

export default class DeployCommand extends BaseCommand<
    typeof DeployCommand.flags,
    typeof DeployCommand.args
> {
    static description =
        "render and deploy targeted instances to the current environment";
    static strict = false;

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(
        ctx: CommandContext<
            typeof DeployCommand.flags,
            typeof DeployCommand.args
        >
    ) {
        await ctx.handleAuth();
        await ctx.initNamespace();

        await processDeployments(ctx, (chart) => chart.deploy());
    }
}
