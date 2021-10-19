import { Environment } from '../common';
import { runCommand } from '../shell';
import BaseCommand, { CommandInput } from '../baseCommand';

export default class DebugPod extends BaseCommand {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(env: Environment, input: CommandInput<typeof DebugPod.flags>) {
        const { awsRegion } = env.konfig.environment
        await runCommand(`k8sDebugPod --az ${awsRegion}a`);
    }
}
