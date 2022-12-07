`konfigure edit`
================

open the konfig file for the current environment in your editor

* [`konfigure edit ENVIRONMENT`](#konfigure-edit-environment)

## `konfigure edit ENVIRONMENT`

open the konfig file for the current environment in your editor

```
USAGE
  $ konfigure edit [ENVIRONMENT] [-h] [--dryrun] [--testing] [--auth] [--debug] [--cd] [--base-dir <value>]

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
  open the konfig file for the current environment in your editor
```

_See code: [src/commands/edit.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/edit.ts)_
