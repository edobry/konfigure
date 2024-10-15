import * as k8s from "@kubernetes/client-node";

import { CommandInput } from "./baseCommand";
import { Flags } from "./flags";
import { Konfiguration } from "./konfiguration";
import Logger from "./logger";
import { initChiShell, InteractiveShell } from "./shell";

export type Environment = {
    konfig: Konfiguration;
    shell: InteractiveShell;
};

export type K8sNamespaceApi = Pick<k8s.CoreV1Api, "readNamespace" | "createNamespace">;

export class CommandContext<T extends Flags> {
    static async init<T extends Flags>(
        log: Logger,
        input: CommandInput<T>
    ): Promise<CommandContext<T>> {
        const { args, flags } = input;

        if(!args) throw new Error();
        const envName: string = args.environment;

        let konfig;
        try {
            konfig = await Konfiguration.read(envName, flags["base-dir"]);
        } catch (e) {
            log.fatal(e as Error);
        }

        konfig.logHeader();

        const shell = await initChiShell();

        return new CommandContext(log, input, { konfig, shell });
    }

    constructor(
        private log: Logger,
        public input: CommandInput<T>,
        public env: Environment
    ) {}

    initK8sApi(): K8sNamespaceApi {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();

        let k8sApi: k8s.CoreV1Api;
        try {
            kc.setCurrentContext(this.env.konfig.environment.k8sContext);
            k8sApi = kc.makeApiClient(k8s.CoreV1Api);
        } catch (e) {
            this.log.error(e as string);
            process.exit(1);
        }

        return k8sApi;
    }

    async initNamespace(k8sApi?: K8sNamespaceApi) {
        if(!k8sApi)
            k8sApi = this.initK8sApi();

        const envName = this.env.konfig.name;
        const nsName = this.env.konfig.environment.k8sNamespace || envName;

        try {
            this.log.debug("fetching namespace");
            const namespace = await k8sApi.readNamespace(nsName);
            this.log.debug(JSON.stringify(namespace));
            return;
        } catch (e) {
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
            this.log.info(`Initializing environment '${envName}' with namespace '${nsName}'...`);
            this.log.info("Creating namespace...");

            const { response, body } = await k8sApi.createNamespace({
                metadata: { name: nsName },
            });

            this.log.info("Environment initialized!");
            this.log.debugYaml(body);
        } catch (e) {
            this.log.error("Namespace creation failed!");
            this.log.error(JSON.stringify(e));
        }
    }

    async handleAuth() {
        const account = this.env.konfig.environment.awsAccount;
        const accountRole = "admin";
        const profile = `${account}-${accountRole}`;

        this.log.infoBlank();
        this.log.info("Checking authentication...");
        try {
            if(this.input.flags.auth) {
                const authCommand = `awsAuth ${profile}`;
                if(this.input.flags.dryrun)
                    this.log.info(`dryrun: ${authCommand}`);
                else {
                    await this.env.shell.runCommand(authCommand);
                    process.env.AWS_PROFILE = profile;
                }
            }

            const checkAuthCommand = `checkAccountAuthAndFail ${account}`;
            if(this.input.flags.dryrun) {
                this.log.info(`dryrun: ${checkAuthCommand}`);
                return;
            }

            const { exitcode } = await this.env.shell.runCommand(
                checkAuthCommand
            );
            this.log.debug(`check exit code: ${exitcode}`);
            if(exitcode != 0) process.exit(1);
        } catch (e) {
            process.exit(1);
        }
    }
};
