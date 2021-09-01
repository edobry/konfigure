import { flags } from '@oclif/command'

export const dryrun = flags.boolean({
    description: "print out commands rather than executing"
});

export const testing = flags.boolean({
    description: "skip expensive operations during development"
});

export const auth = flags.boolean({
    description: "automatically authenticate with the appropriate AWS account"
});

export const debug = flags.boolean({
    description: "log out debug information"
});

export const commonFlags = {
    dryrun, testing, auth, debug
}
