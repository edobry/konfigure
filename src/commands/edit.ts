import BaseCommand, { CommandContext, runCommand } from '../baseCommand';
import { Konfiguration } from '../konfiguration';

export default class EditCommand extends BaseCommand<typeof EditCommand.flags> {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;
    
    async command({ env }: CommandContext<typeof EditCommand.flags>) {
        console.log(`Opening konfig for environment '${env.konfig.name}' in editor...`);

        try {
            await runCommand(`$EDITOR ${env.konfig.konfigPath}`);
        } catch(e) {
            console.log(e);
        }
    }
}
