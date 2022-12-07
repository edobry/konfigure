`konfigure render`
==================

substitutes values and renders manifests for the targeted deployments, printing results

* [`konfigure render ENVIRONMENT`](#konfigure-render-environment)

## `konfigure render ENVIRONMENT`

substitutes values and renders manifests for the targeted deployments, printing results

```
USAGE
  $ konfigure render [ENVIRONMENT] [-h] [--dryrun] [--testing] [--auth] [--debug] [--cd] [--base-dir <value>]

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
  substitutes values and renders manifests for the targeted deployments, printing results
```

_See code: [src/commands/render.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/render.ts)_
