import { Flags } from "./flags";
import { Konfiguration } from "./konfiguration";
import { prettyPrintYaml, readOptionalFile } from "./util";
import { HelmChart } from "./helm";
import { $, ProcessOutput } from "zx";
import envPaths from "env-paths";
import { getSystemErrorMap } from "util";

async function initZx() {
    $.verbose = false;

    if(process.env.SHELL)
        $.shell = process.env.SHELL;

    const configDir = process.env.XDG_CONFIG_HOME || `${process.env.HOME || "~/"}/.config`;
    const dtConfigFile = `${configDir}/dataeng-tools/config.json`;

    const dtConfig = await readOptionalFile(dtConfigFile);
    // console.debug(prettyPrintYaml(dtConfig))
    const projectDir = dtConfig.projectDir

    $.prefix = `source ${projectDir}/dataeng-tools/shell/init.sh; `
}

export interface CommandInput {
    flags: Flags;
    argv: string[];
}

export async function initEnv({ argv, flags }: CommandInput) {
    const konfig = await Konfiguration.read(argv[0]);

    console.log(konfig.header())
    console.log()

    await initZx();
    await handleAuth(flags, konfig)

    return konfig;
};

async function handleAuth(flags: Flags, konfig: Konfiguration) {
    const account = konfig.environment.awsAccount;
    const accountRole = "admin"
    if(flags.auth)
        await $`awsAuth ${account}-${accountRole}`.pipe(process.stdout);
    
    try {
        await $`checkAccountAuthAndFail ${account}`
    } catch (e) {
        const { stdout } = e as ProcessOutput;
        console.log(stdout);
        process.exit(1);
    }
}

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
