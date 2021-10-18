import Command from '@oclif/command'

import { commonArgs, commonFlags } from '../flags';
import { printMode } from '../util';
import { initEnv } from '../common';
import { runCommand, runDtCommand } from '../shell';

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
        await env.shell.close();

        const { awsAccount, k8sContext, k8sNamespace } = env.konfig.environment;

        console.log(`Launching K9s in context '${k8sContext}', namespace '${k8sNamespace}'`);
        await runDtCommand(`k9s --context "${k8sContext}" --namespace "${k8sNamespace}" -c deployments`);
    }
}
