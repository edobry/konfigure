import { Flags } from "./flags";
import { CommandInput } from './baseCommand';
import { Konfiguration } from "./konfiguration";
import { initDtShell, InteractiveShell } from "./shell";
import { HelmChart, updateHelmRepos } from "./helm";
import Logger from "./logger";

export type Environment = {
    konfig: Konfiguration,
    shell: InteractiveShell
};

export async function initEnv<T extends Flags>({ args, flags }: CommandInput<T>): Promise<Environment> {
    if(!args) throw new Error();
    const envName: string = args.environment;

    let konfig;
    try {
        konfig = await Konfiguration.read(envName);
    } catch (e) {
        const { code } = e as Error & { code: "ENOENT" };
        if(code == "ENOENT") {
            Logger.root.info(`No konfiguration file found for the ${envName} environment!`)
        } else {
            Logger.root.error(e as string);
        }

        process.exit(1);
    }

    konfig.logHeader()

    const shell = await initDtShell();
    await handleAuth(flags, konfig, shell);

    return { konfig, shell };
};


async function handleAuth(flags: Flags, konfig: Konfiguration, shell: InteractiveShell) {
    const account = konfig.environment.awsAccount;
    const accountRole = "admin"
    const profile = `${account}-${accountRole}`;
    
    Logger.root.infoBlank();
    Logger.root.info("Checking authentication...");
    try {
        if(flags.auth) {
            const authCommand = `awsAuth ${profile}`;
            if(flags.dryrun)
                Logger.root.info(authCommand)
            else {
                await shell.runCommand(authCommand)
                process.env.AWS_PROFILE = profile;
            }
        }

        
        const checkAuthCommand = `checkAccountAuthAndFail ${account}`;
        if(flags.dryrun) {
            Logger.root.info(checkAuthCommand)
            return;
        }
        
        const { exitcode } = await shell.runCommand(checkAuthCommand);
        Logger.root.debug(`check exit code: ${exitcode}`);
        if(exitcode != 0)
            process.exit(1);
    }
    catch(e) {
        process.exit(1)
    }
};

// async function checkAuth(account: string) {
//     try {
//         const id = await $`aws sts get-caller-identity`
//         id.stdout
//     } catch(e) {
//         Logger.root.info("Unauthenticated! Please authenticate with AWS before rerunning.")
//         process.exit(1);
//     }
// }

export async function processDeployments<T extends Flags>(input: CommandInput<T>, env: Environment, chartHandler: (chart: HelmChart<T>) => Promise<void>, skipRepoUpdate?: boolean,) {
    const deployments = env.konfig.filterDeployments<T>(input);

    if(deployments.length == 0) {
        Logger.root.info("No deployments configured, nothing to do. Exiting!")
        return;
    }

    // TODO: check if helm charts present
    if(!input.flags.testing && !skipRepoUpdate)
        updateHelmRepos(env.shell, input.flags.dryrun);

    const envValues = {
        region: env.konfig?.environment.awsRegion,
        nodegroup: env.konfig?.environment.eksNodegroup,
        nodeSelector: {
            "eks.amazonaws.com/nodegroup": env.konfig?.environment.eksNodegroup
        }
    };
    Logger.root.debug("Env values:")
    Logger.root.debugYaml(envValues);

    await Promise.all(deployments
        .map(entry =>
            new HelmChart(...entry, envValues, env, input))
        .map(chartHandler));
};
