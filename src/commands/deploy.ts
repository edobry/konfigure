import BaseCommand, { CommandInput, Environment, processDeployments } from '../baseCommand';

export default class Deploy extends BaseCommand {
    static description = "deploy instances to the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(env: Environment, input: CommandInput<typeof Deploy.flags>) {
        await processDeployments(input, env,
            chart => chart.deploy());
    }
}
