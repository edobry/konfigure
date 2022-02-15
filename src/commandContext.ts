import * as k8s from "@kubernetes/client-node";

import BaseCommand, { CommandInput } from "./baseCommand";
import { Flags } from "./flags";
import { Konfiguration } from "./konfiguration";
import Logger from "./logger";
import { initDtShell, InteractiveShell } from "./shell";
import { UnpackAny } from "./util";

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

        return new CommandContext(log, input, { konfig, shell });
    }

    async initNamespace() {
        const kc = new k8s.KubeConfig();
        kc.loadFromFile(`${process.env.CA_DT_DIR}/shell/eksconfig.yaml`)
        
        let k8sApi: k8s.CoreV1Api;
        try {
            kc.setCurrentContext(this.env.konfig.environment.k8sContext);
            k8sApi = kc.makeApiClient(k8s.CoreV1Api);
        } catch(e) {
            this.log.error(e as string);
            process.exit(1);
        }

        const name = this.env.konfig.name;

        try {
            this.log.debug("fetching namespace");
            const namespace = await k8sApi.readNamespace(name);
            this.log.debug(JSON.stringify(namespace));
            return;
        } catch(e) {
            // const { response: { statusCode, body } } = e as UnpackAny<ReturnType<typeof k8sApi.readNamespace>>;
            this.log.error(e as string);

            // const msg = `HTTP ${statusCode}: ${body.message}`;
            // if(statusCode == 404)
            //     this.log.debug(msg);
            // else {
            //     this.log.error(msg);
            //     this.log.error(JSON.stringify(e));
            //     throw e;
            // }
        }

        try {
            this.log.infoBlank();
            this.log.info(`Initializing environment '${name}'...`);
            this.log.info("Creating namespace...");

            const { response, body } = await k8sApi.createNamespace({
                metadata: { name: name }
            });

            this.log.info(`Environment initialized!`);
            this.log.debugYaml(body);
        } catch(e) {
            this.log.error("Namespace creation failed!");
            this.log.error(JSON.stringify(e));
        }
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
