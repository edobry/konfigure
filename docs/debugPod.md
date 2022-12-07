`konfigure debugPod`
====================

launches a `debugPod` configured with the specified environment

* [`konfigure debugPod ENVIRONMENT`](#konfigure-debugpod-environment)

## `konfigure debugPod ENVIRONMENT`

launches a `debugPod` configured with the specified environment

```
USAGE
  $ konfigure debugPod [ENVIRONMENT] [-h] [--dryrun] [--testing] [--auth] [--debug] [--cd] [--base-dir
    <value>] [--serviceAccount <value>]

ARGUMENTS
  ENVIRONMENT  the environment konfiguration to use

FLAGS
  -h, --help                Show CLI help.
  --auth                    automatically authenticate with the appropriate AWS account
  --base-dir=<value>        the base directory to search for environments
  --cd                      running in a CI environment
  --debug                   log out debug information
  --dryrun                  print out commands rather than executing
  --serviceAccount=<value>  which service account to run as
  --testing                 skip expensive operations during development

DESCRIPTION
  launches a `debugPod` configured with the specified environment
```

_See code: [src/commands/debugPod.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/debugPod.ts)_
