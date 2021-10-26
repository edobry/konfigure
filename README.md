konfigure
=========



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/konfigure.svg)](https://npmjs.org/package/konfigure)
[![Downloads/week](https://img.shields.io/npm/dw/konfigure.svg)](https://npmjs.org/package/konfigure)
[![License](https://img.shields.io/npm/l/konfigure.svg)](https://github.com/chainalysis/konfigure/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g konfigure
$ konfigure COMMAND
running command...
$ konfigure (-v|--version|version)
konfigure/0.0.0 darwin-x64 node-v16.11.1
$ konfigure --help [COMMAND]
USAGE
  $ konfigure COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`konfigure debugPod ENVIRONMENT`](#konfigure-debugpod-environment)
* [`konfigure deploy ENVIRONMENT`](#konfigure-deploy-environment)
* [`konfigure edit ENVIRONMENT`](#konfigure-edit-environment)
* [`konfigure help [COMMAND]`](#konfigure-help-command)
* [`konfigure k9s ENVIRONMENT`](#konfigure-k9s-environment)
* [`konfigure redeploy ENVIRONMENT`](#konfigure-redeploy-environment)
* [`konfigure render ENVIRONMENT`](#konfigure-render-environment)
* [`konfigure teardown ENVIRONMENT`](#konfigure-teardown-environment)

## `konfigure debugPod ENVIRONMENT`

launch k9s in the current environment

```
USAGE
  $ konfigure debugPod ENVIRONMENT

ARGUMENTS
  ENVIRONMENT  the environment to use

OPTIONS
  -h, --help  show CLI help
  --auth      automatically authenticate with the appropriate AWS account
  --cd        running in a CI environment
  --debug     log out debug information
  --dryrun    print out commands rather than executing
  --testing   skip expensive operations during development
```

_See code: [src/commands/debugPod.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/debugPod.ts)_

## `konfigure deploy ENVIRONMENT`

deploy instances to the current environment

```
USAGE
  $ konfigure deploy ENVIRONMENT

ARGUMENTS
  ENVIRONMENT  the environment to use

OPTIONS
  -h, --help  show CLI help
  --auth      automatically authenticate with the appropriate AWS account
  --cd        running in a CI environment
  --debug     log out debug information
  --dryrun    print out commands rather than executing
  --testing   skip expensive operations during development
```

_See code: [src/commands/deploy.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/deploy.ts)_

## `konfigure edit ENVIRONMENT`

launch k9s in the current environment

```
USAGE
  $ konfigure edit ENVIRONMENT

ARGUMENTS
  ENVIRONMENT  the environment to use

OPTIONS
  -h, --help  show CLI help
  --auth      automatically authenticate with the appropriate AWS account
  --cd        running in a CI environment
  --debug     log out debug information
  --dryrun    print out commands rather than executing
  --testing   skip expensive operations during development
```

_See code: [src/commands/edit.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/edit.ts)_

## `konfigure help [COMMAND]`

display help for konfigure

```
USAGE
  $ konfigure help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

## `konfigure k9s ENVIRONMENT`

launch k9s in the current environment

```
USAGE
  $ konfigure k9s ENVIRONMENT

ARGUMENTS
  ENVIRONMENT  the environment to use

OPTIONS
  -h, --help  show CLI help
  --auth      automatically authenticate with the appropriate AWS account
  --cd        running in a CI environment
  --debug     log out debug information
  --dryrun    print out commands rather than executing
  --testing   skip expensive operations during development
```

_See code: [src/commands/k9s.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/k9s.ts)_

## `konfigure redeploy ENVIRONMENT`

tear down and redeploy instances to the current environment

```
USAGE
  $ konfigure redeploy ENVIRONMENT

ARGUMENTS
  ENVIRONMENT  the environment to use

OPTIONS
  -h, --help  show CLI help
  --auth      automatically authenticate with the appropriate AWS account
  --cd        running in a CI environment
  --debug     log out debug information
  --dryrun    print out commands rather than executing
  --testing   skip expensive operations during development
```

_See code: [src/commands/redeploy.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/redeploy.ts)_

## `konfigure render ENVIRONMENT`

render instance manifests

```
USAGE
  $ konfigure render ENVIRONMENT

ARGUMENTS
  ENVIRONMENT  the environment to use

OPTIONS
  -h, --help  show CLI help
  --auth      automatically authenticate with the appropriate AWS account
  --cd        running in a CI environment
  --debug     log out debug information
  --dryrun    print out commands rather than executing
  --testing   skip expensive operations during development
```

_See code: [src/commands/render.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/render.ts)_

## `konfigure teardown ENVIRONMENT`

tears down instances from the current environment

```
USAGE
  $ konfigure teardown ENVIRONMENT

ARGUMENTS
  ENVIRONMENT  the environment to use

OPTIONS
  -h, --help  show CLI help
  --auth      automatically authenticate with the appropriate AWS account
  --cd        running in a CI environment
  --debug     log out debug information
  --dryrun    print out commands rather than executing
  --testing   skip expensive operations during development
```

_See code: [src/commands/teardown.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/teardown.ts)_
<!-- commandsstop -->
