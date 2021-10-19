import { initEnv } from '../common';
import { runCommand } from '../shell';
import BaseCommand from '../baseCommand';

export default class Edit extends BaseCommand {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;
    
    async run() {
        this.printMode(this.input!, this.constructor);

        const env = await initEnv(this.input!);
        await env.shell.close();
        
        console.log(`Opening konfig for environment '${env.konfig.name}' in editor...`)
        try {
            await runCommand(`$EDITOR env/${env.konfig.name}/konfig.json`);
        } catch(e) {
            console.log(e);
        }
    }
}
