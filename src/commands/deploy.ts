import { initEnv, processDeployments } from '../common';
import BaseCommand from '../baseCommand';

export default class Deploy extends BaseCommand {
    static description = "deploy instances to the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async run() {
        this.printMode(this.input!, this.constructor);

        const env = await initEnv(this.input!);
        await processDeployments(this.input!, env,
            chart => chart.deploy());

        await env.shell.close();
    }
}
