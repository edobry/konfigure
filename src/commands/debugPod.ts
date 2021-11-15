import { flags } from '@oclif/command';
import BaseCommand, { CommandContext, runDtCommand } from '../baseCommand';

export default class DebugPodCommand extends BaseCommand<typeof DebugPodCommand.flags> {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = {
        ...BaseCommand.flags,
        serviceAccount: flags.string({
            description: "which service account to run as"
        })
    };
    static args = BaseCommand.args;

    async command({ env, input }: CommandContext<typeof DebugPodCommand.flags>) {
        const { awsRegion } = env.konfig.environment
        
        const args = [];
        if(input.flags.serviceAccount)
            args.push("--serviceAccount", input.flags.serviceAccount)

        const debugPodCommand = `k8sDebugPod --az ${awsRegion}a ${args.join(' ')}`;
        if(input.flags.dryrun)
            this.logger.info(debugPodCommand)
        else
            await runDtCommand(debugPodCommand);
    }
};
