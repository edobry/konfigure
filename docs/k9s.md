`konfigure k9s`
===============

launch k9s in the current environment

* [`konfigure k9s ENVIRONMENT`](#konfigure-k9s-environment)

## `konfigure k9s ENVIRONMENT`

launch k9s in the current environment

```
USAGE
  $ konfigure k9s [ENVIRONMENT] [-h] [--dryrun] [--testing] [--auth] [--debug] [--cd] [--base-dir <value>]

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
  launch k9s in the current environment
```

_See code: [src/commands/k9s.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/k9s.ts)_
