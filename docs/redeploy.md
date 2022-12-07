`konfigure redeploy`
====================

`teardown` and then `deploy` targeted instances to the current environment

* [`konfigure redeploy ENVIRONMENT`](#konfigure-redeploy-environment)

## `konfigure redeploy ENVIRONMENT`

`teardown` and then `deploy` targeted instances to the current environment

```
USAGE
  $ konfigure redeploy [ENVIRONMENT] [-h] [--dryrun] [--testing] [--auth] [--debug] [--cd] [--base-dir <value>]

ARGUMENTS
  ENVIRONMENT  the environment konfiguration to use

FLAGS
  -h, --help          Show CLI help.
  --auth              automatically authenticate with the appropriate AWS account
  --base-dir=<value>  the base directory to search for environments
  --cd                running in a CI environment
  --debug             log out debug information
  --dryrun            print out commands rather than executing
  --testing           skip expensive operations during development

DESCRIPTION
  `teardown` and then `deploy` targeted instances to the current environment
```

_See code: [src/commands/redeploy.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/redeploy.ts)_
