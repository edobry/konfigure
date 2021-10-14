import Command from '@oclif/command'

import { commonArgs, commonFlags } from '../flags';
import { printMode } from '../util';
import { initEnv } from '../common';
import { runCommand } from '../shell';

export default class DebugPod extends Command {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = {
       ...commonFlags
    }
    
    static args = [
        ...commonArgs
    ];

    async run() {
        const input = this.parse(DebugPod);

        printMode(input, this.constructor);

        const env = await initEnv(input);

        const { awsRegion } = env.konfig.environment
        await runCommand(`k8sDebugPod --az ${awsRegion}a`);
    }
}
