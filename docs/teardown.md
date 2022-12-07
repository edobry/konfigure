`konfigure teardown`
====================

tears down instances from the current environment

* [`konfigure teardown ENVIRONMENT`](#konfigure-teardown-environment)

## `konfigure teardown ENVIRONMENT`

tears down instances from the current environment

```
USAGE
  $ konfigure teardown [ENVIRONMENT] [-h] [--dryrun] [--testing] [--auth] [--debug] [--cd] [--base-dir <value>]

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
  tears down instances from the current environment
```

_See code: [src/commands/teardown.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/teardown.ts)_
