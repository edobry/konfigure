`konfigure getDns`
==================

query the provisioned DNS name for the given deployment

* [`konfigure getDns ENVIRONMENT`](#konfigure-getdns-environment)

## `konfigure getDns ENVIRONMENT`

query the provisioned DNS name for the given deployment

```
USAGE
  $ konfigure getDns [ENVIRONMENT] [-h] [--dryrun] [--testing] [--auth] [--debug] [--cd] [--base-dir <value>]

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
  query the provisioned DNS name for the given deployment
```

_See code: [src/commands/getDns.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/getDns.ts)_
