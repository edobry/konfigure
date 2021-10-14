import Command from '@oclif/command'

import { commonArgs, commonFlags } from '../flags';
import { printMode } from '../util';
import { initEnv } from '../common';
import { runDtCommand } from '../shell';

export default class K9s extends Command {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = {
       ...commonFlags
    }
    
    static args = [
        ...commonArgs
    ];

    async run() {
        const input = this.parse(K9s);
        printMode(input, this.constructor);
        const env = await initEnv(input);
        env.shell.close();

        const { awsAccount, k8sContext, k8sNamespace } = env.konfig.environment;
        await runDtCommand(`k9sEnv ${awsAccount}-admin ${k8sContext} ${k8sNamespace}`);
    }
}
