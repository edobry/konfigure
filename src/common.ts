import { Flags } from "./flags";
import { CommandInput } from './baseCommand';
import { Konfiguration } from "./konfiguration";
import { initDtShell, InteractiveShell } from "./shell";
import { prettyPrintYaml } from "./util";
import { HelmChart, runHelmCommand, updateHelmRepos } from "./helm";

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
            console.log(`No konfiguration file found for the ${envName} environment!`)
        } else {
            console.error(e);
        }

        process.exit(1);
    }

    console.log(konfig.header())
    console.log()

    const shell = await initDtShell();
    await handleAuth(flags, konfig, shell);

    return { konfig, shell };
};


async function handleAuth(flags: Flags, konfig: Konfiguration, shell: InteractiveShell) {
    const account = konfig.environment.awsAccount;
    const accountRole = "admin"
    const profile = `${account}-${accountRole}`;
    
    console.log("Checking authentication...")
    try {
        if(flags.auth) {
            await shell.runCommand(`awsAuth ${profile}`)
            process.env.AWS_PROFILE = profile;
        }

        const { exitcode } = await shell.runCommand(`checkAccountAuthAndFail ${account}`);
        // console.debug(`check exit code: ${exitcode}`)
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
//         console.log("Unauthenticated! Please authenticate with AWS before rerunning.")
//         process.exit(1);
//     }
// }

// export async function processDeployments<T extends Flags>(input: CommandInput<T>, env: Environment, updateRepos: boolean, chartHandler: (chart: HelmChart<T>) => Promise<void>) {
export async function processDeployments<T extends Flags>(input: CommandInput<T>, env: Environment, chartHandler: (chart: HelmChart<T>) => Promise<void>) {
    const deployments = env.konfig.filterDeployments(input.argv.slice(1));

    if(deployments.length == 0) {
        console.log("No deployments configured, nothing to do. Exiting!")
        return;
    }

    // TODO: check if helm charts present
    if(!input.flags.testing)
        updateHelmRepos(env.shell, input.flags.dryrun);

    console.log("\nEnv values:")
    const envValues = {
        region: env.konfig?.environment.awsRegion,
        nodegroup: env.konfig?.environment.eksNodegroup,
        nodeSelector: {
            "eks.amazonaws.com/nodegroup": env.konfig?.environment.eksNodegroup
        }
    };

    console.log(prettyPrintYaml(envValues));

    await Promise.all(deployments
        .map(entry =>
            new HelmChart(...entry, envValues, env, input))
        .map(chartHandler));
};
