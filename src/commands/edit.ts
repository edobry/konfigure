import { Environment } from '../common';
import { runCommand } from '../shell';
import BaseCommand, { CommandInput } from '../baseCommand';

export default class Edit extends BaseCommand {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;
    
    async command(env: Environment, input: CommandInput<typeof Edit.flags>) {
        console.log(`Opening konfig for environment '${env.konfig.name}' in editor...`)
        try {
            await runCommand(`$EDITOR env/${env.konfig.name}/konfig.json`);
        } catch(e) {
            console.log(e);
        }
    }
}
