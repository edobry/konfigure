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
konfigure/0.0.0 darwin-x64 node-v16.5.0
$ konfigure --help [COMMAND]
USAGE
  $ konfigure COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`konfigure hello [FILE]`](#konfigure-hello-file)
* [`konfigure help [COMMAND]`](#konfigure-help-command)

## `konfigure hello [FILE]`

describe the command here

```
USAGE
  $ konfigure hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ konfigure hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/chainalysis/konfigure/blob/v0.0.0/src/commands/hello.ts)_

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
<!-- commandsstop -->
