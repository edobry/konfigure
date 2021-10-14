import Command from '@oclif/command'

import { commonArgs, commonFlags } from '../flags';
import { printMode } from '../util';
import { initEnv } from '../common';
import { runCommand } from '../shell';

export default class Edit extends Command {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = {
       ...commonFlags
    }
    
    static args = [
        ...commonArgs
    ];

    async run() {
        const input = this.parse(Edit);
        printMode(input, this.constructor);
        const env = await initEnv(input);
        await env.shell.close();
        
        console.log(`Opening konfig for environment '${env.konfig.name}' in editor...`)
        try {
            await runCommand(`$EDITOR env/${env.konfig.name}/konfig.json`);
        } catch(e) {
            console.log(e);
        }
    }
}
