import { Flags } from "./flags";
import { Konfiguration } from "./konfiguration";
import { prettyPrintYaml } from "./util";
import { HelmChart } from "./helm";
import { initDtShell, ShellCommand } from "./shell";

export interface CommandInput {
    flags: Flags;
    argv: string[];
}

export async function initEnv({ argv, flags }: CommandInput) {
    const konfig = await Konfiguration.read(argv[0]);

    console.log(konfig.header())
    console.log()

    const { childShell, runCommand, exit, shellClose } = await initDtShell();
    await handleAuth(flags, konfig, runCommand);

    exit();
    const output = await shellClose;
    // console.log("output")
    // console.log(output)

    return konfig;
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

export async function processDeployments(input: CommandInput, konfig: Konfiguration, chartHandler: (chart: HelmChart) => Promise<void>) {
    const deployments = konfig.filterDeployments(input.argv.slice(1));

    if(deployments.length == 0) {
        console.log("No deployments configured, nothing to do. Exiting!")
        return;
    }

    console.log("\nEnv values:")
    const envValues = {
        region: konfig?.environment.awsRegion,
        nodegroup: konfig?.environment.eksNodegroup,
        nodeSelector: {
            "eks.amazonaws.com/nodegroup": konfig?.environment.eksNodegroup
        }
    };

    console.log(prettyPrintYaml(envValues));

    deployments
        .map(entry =>
            new HelmChart(...entry, envValues, konfig, input))
        .forEach(chartHandler);
};
