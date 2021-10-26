import BaseCommand, { processDeployments, CommandContext } from '../baseCommand';

export default class DeployCommand extends BaseCommand<typeof DeployCommand.flags> {
    static description = "deploy instances to the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(ctx: CommandContext<typeof DeployCommand.flags>) {
        await processDeployments(ctx,
            chart => chart.deploy());
    }
}
