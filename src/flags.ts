import { Flags, Interfaces } from "@oclif/core";
import { Flag, FlagInput, ParserInput } from "@oclif/core/lib/interfaces";
// import { flags as parserFlags } from "@oclif/core";

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

export const envArg = {
    name: "environment",
    description: "the environment konfiguration to use",
    required: true
};

export const instanceArg = {
    name: "instances",
    description: "the instances to process",
    required: true
};

export const commonArgs = [envArg];

export type Flags = { [index: string]: Flag<any> };
