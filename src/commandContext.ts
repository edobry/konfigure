import BaseCommand, { CommandInput } from "./baseCommand";
import { Flags } from "./flags";
import { Konfiguration } from "./konfiguration";
import Logger from "./logger";
import { initDtShell, InteractiveShell } from "./shell";

export type Environment = {
    konfig: Konfiguration,
    shell: InteractiveShell
};

export class CommandContext<T extends Flags> {    
    constructor(private log: Logger, public input: CommandInput<T>, public env: Environment) {}

    static async init<T extends Flags>(log: Logger, input: CommandInput<T>): Promise<CommandContext<T>> {
        const { args, flags } = input;

        if(!args) throw new Error();
        const envName: string = args.environment;

        let konfig;
        try {
            konfig = await Konfiguration.read(envName);
        } catch (e) {
            const { code } = e as Error & { code: "ENOENT" };
            if(code == "ENOENT") {
                log.info(`No konfiguration file found for the ${envName} environment!`)
            } else {
                log.error(e as string);
            }

            process.exit(1);
        }

        konfig.logHeader()

        const shell = await initDtShell();

        const context = new CommandContext(log, input, { konfig, shell });
        await context.handleAuth();
        return context;
    }

    async handleAuth() {
        const account = this.env.konfig.environment.awsAccount;
        const accountRole = "admin"
        const profile = `${account}-${accountRole}`;
        
        this.log.infoBlank();
        this.log.info("Checking authentication...");
        try {
            if(this.input.flags.auth) {
                const authCommand = `awsAuth ${profile}`;
                if(this.input.flags.dryrun)
                    this.log.info(`dryrun: ${authCommand}`)
                else {
                    await this.env.shell.runCommand(authCommand)
                    process.env.AWS_PROFILE = profile;
                }
            }

            const checkAuthCommand = `checkAccountAuthAndFail ${account}`;
            if(this.input.flags.dryrun) {
                this.log.info(`dryrun: ${checkAuthCommand}`)
                return;
            }
            
            const { exitcode } = await this.env.shell.runCommand(checkAuthCommand);
            this.log.debug(`check exit code: ${exitcode}`);
            if(exitcode != 0)
                process.exit(1);
        }
        catch(e) {
            process.exit(1)
        }
    }
};
