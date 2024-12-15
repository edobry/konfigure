import { Args, Flags } from "@oclif/core";
import { Flag, Arg } from "@oclif/core/interfaces";

export const help = Flags.help({ char: "h" });

export const dryrun = Flags.boolean({
    description: "print out commands rather than executing"
});

export const testing = Flags.boolean({
    description: "skip expensive operations during development"
});

export const auth = Flags.boolean({
    description: "automatically authenticate with the appropriate AWS account"
});

export const debug = Flags.boolean({
    description: "log out debug information"
});

export const cd = Flags.boolean({
    description: "running in a CI environment"
});

export const baseDir = Flags.string({
    description: "the base directory to search for environments",
});

export const commonFlags = {
    help, dryrun, testing, auth, debug, cd, "base-dir": baseDir
};

export const envArg = Args.string({
    name: "environment",
    description: "the environment konfiguration to use",
    required: true
});

export const instanceArg = Args.string({
    name: "instances",
    description: "the instances to process",
    required: true
});

export const commonArgs = {
    environment: envArg
};

export type Flags = { [index: string]: Flag<any> };
export type Args = { [index: string]: Arg<any> };
