import BaseCommand, { CommandInput, Environment, processDeployments } from '../baseCommand';

export default class Teardown extends BaseCommand {
    static description = "tears down instances from the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(env: Environment, input: CommandInput<typeof Teardown.flags>) {
        await processDeployments(input, env,
            chart => chart.uninstall());
    }
}
