import BaseCommand, { CommandInput, Environment, processDeployments } from '../baseCommand';

export default class Redeploy extends BaseCommand {
    static description = "tear down and redeploy instances to the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(env: Environment, input: CommandInput<typeof Redeploy.flags>) {
        await processDeployments(input, env,
            async chart => {
                await chart.uninstall();
                return chart.deploy();
            });
    }
}
