import { Flags } from "./flags";
import { Konfiguration } from "./konfiguration";
import { prettyPrintYaml } from "./util";
import { HelmChart } from "./helm";
import { initDtShell, Shell, ShellCommand } from "./shell";

export interface CommandInput {
    flags: Flags;
    argv: string[];
}

export type Environment = {
    konfig: Konfiguration,
    shell: Shell
}

export async function initEnv({ argv, flags }: CommandInput): Promise<Environment> {
    const envName = argv[0];

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
    await handleAuth(flags, konfig, shell.runCommand);

    return { konfig, shell };
};


async function handleAuth(flags: Flags, konfig: Konfiguration, runCommand: ShellCommand) {
    const account = konfig.environment.awsAccount;
    const accountRole = "admin"
    if(flags.auth) {
        const { output } = await runCommand(`awsAuth ${account}-${accountRole}`)
        console.log(output);
    }
    
    const { exitcode, output } = await runCommand(`checkAccountAuthAndFail ${account}`);

    if(exitcode != 0) {
        console.log(output);
        process.exit(1);
    }
};

export async function processDeployments(input: CommandInput, env: Environment, chartHandler: (chart: HelmChart) => Promise<void>) {
    const deployments = env.konfig.filterDeployments(input.argv.slice(1));

    if(deployments.length == 0) {
        console.log("No deployments configured, nothing to do. Exiting!")
        return;
    }

    console.log("\nEnv values:")
    const envValues = {
        region: env.konfig?.environment.awsRegion,
        nodegroup: env.konfig?.environment.eksNodegroup,
        nodeSelector: {
            "eks.amazonaws.com/nodegroup": env.konfig?.environment.eksNodegroup
        }
    };

    console.log(prettyPrintYaml(envValues));

    deployments
        .map(entry =>
            new HelmChart(...entry, envValues, env, input))
        .forEach(chartHandler);
};
