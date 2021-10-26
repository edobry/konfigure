import BaseCommand, { CommandContext, runCommand } from '../baseCommand';

export default class DebugPodCommand extends BaseCommand<typeof DebugPodCommand.flags> {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command({ env }: CommandContext<typeof DebugPodCommand.flags>) {
        const { awsRegion } = env.konfig.environment
        await runCommand(`k8sDebugPod --az ${awsRegion}a`);
    }
};
