import BaseCommand, { CommandContext, processDeployments } from "../baseCommand";

export default class RenderCommand extends BaseCommand<typeof RenderCommand.flags> {
    static description = "substitutes values and renders manifests for the targeted deployments, printing results";
    static strict = false;

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(ctx: CommandContext<typeof RenderCommand.flags>) {
        await processDeployments(ctx,
            chart => chart.render());
    }
}
