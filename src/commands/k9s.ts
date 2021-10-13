import Command from '@oclif/command'

import { commonArgs, commonFlags } from '../flags';
import { printMode } from '../util';
import { initEnv, processDeployments } from '../common';

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

        const { awsAccount, k8sContext, k8sNamespace } = env.konfig.environment
        
        await env.shell.runCommand(`k9sEnv ${awsAccount}-admin ${k8sContext} ${k8sNamespace}`)

        const output = await env.shell.close();
        // console.log(output);
    }
}
