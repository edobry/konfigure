import { initEnv } from '../common';
import { runCommand } from '../shell';
import BaseCommand from '../baseCommand';

export default class DebugPod extends BaseCommand {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;
    
    async run() {
        this.printMode(this.input!, this.constructor);

        const env = await initEnv(this.input!);

        const { awsRegion } = env.konfig.environment
        await runCommand(`k8sDebugPod --az ${awsRegion}a`);
    }
}
