import BaseCommand, { CommandInput, Environment, processDeployments } from '../baseCommand';

export default class Render extends BaseCommand {
    static description = "render instance manifests";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(env: Environment, input: CommandInput<typeof Render.flags>) {
        await processDeployments(input, env,
            chart => chart.render());
    }
}
