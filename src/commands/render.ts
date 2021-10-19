import { initEnv, processDeployments } from '../common';
import BaseCommand from '../baseCommand';

export default class Render extends BaseCommand {
    static description = "render instance manifests";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async run() {
        this.printMode(this.input!, this.constructor);

        const env = await initEnv(this.input!);
        await processDeployments(this.input!, env,
            chart => chart.render());

        await env.shell.close();
    }
}
