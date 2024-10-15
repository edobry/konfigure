# konfigure

This tool facilitates deploying workloads to K8s clusters, providing several convenience features streamlining developer workflows and guarding against common failure modes. It is to be used in conjunction with a Helm/CDK8s chart repository and a live application configuration repository, or within a single application repository.

## Installation

This tool can be installed using `npm`:

```shell
npm install -g konfigure
```

## Usage

The `konfigure` command can be used to `render` charts `deploy` them to a cluster, and to `teardown` afterwords. It is to be run in a directory with a `konfig.yaml` file which sets up an `environment`.

### Commands

The basic form these commands take is:

```shell
konfigure [flags...] [subcommand] [environment] [(optional: chart) target... | all]
```

with the components being as follows:

- `flags`: keywords which, when set, modify the operation of the function
  - `auth`: assumes the appropriate AWS role
  - `debug`: enables more detailed logging
  - `dryrun` simulates a run, printing out commands that would be executed
  - `testing` disables validations and updates, to allow faster iteration
  - `cd` indicates that we are in a Continuous Deployment (CD) environment, enables support for `cdDisabled`
- `subcommand`: see [commands](#command-topics)
- `environment`: which environment to operate in, corresponds to a directory
- `target`: which deployments to operate on. if `all`, no limiting. if prepended with `chart`, args will be interpreted as chart names, rather than deployment names.

<!-- commands -->
#### Command Topics

* [`konfigure debugPod`](docs/debugPod.md) - launches a `debugPod` configured with the specified environment
* [`konfigure deploy`](docs/deploy.md) - render and deploy targeted instances to the current environment
* [`konfigure edit`](docs/edit.md) - open the konfig file for the current environment in your editor
* [`konfigure getDns`](docs/getDns.md) - query the provisioned DNS name for the given deployment
* [`konfigure help`](docs/help.md) - Display help for konfigure.
* [`konfigure k9s`](docs/k9s.md) - launch k9s in the current environment
* [`konfigure redeploy`](docs/redeploy.md) - `teardown` and then `deploy` targeted instances to the current environment
* [`konfigure render`](docs/render.md) - substitutes values and renders manifests for the targeted deployments, printing results
* [`konfigure teardown`](docs/teardown.md) - tears down instances from the current environment
* [`konfigure version`](docs/version.md)

<!-- commandsstop -->

#### Examples

This command pushes the `eth-node` deployment to the `dev` environment:

```shell
konfigure deploy dev eth-node
```

This command does almost the same thing, but prints out the actions that would have been done instead:

```shell
konfigure --dryrun deploy dev eth-node
```

This command deploys all instances of the `backend` chart in the `prod` environment, ie, if releasing a new version:

```shell
konfigure deploy prod chart backend
```

This command generates the manifests for all deployments in the `dev` environment and outputs them to a single file:

```shell
konfigure render dev all > dev-release.yaml
```

This command uninstalls the `seeder` and `backend` deployments from the `dev` environment:

```shell
konfigure teardown dev seeder backend
```

### Configuration

Environments are configured within a directory called `env` in the root of a repository; each environment is represented by a subdirectory and contains a configuration file, as well as several subdirectories, each of which maps to a field in the configuration file.

#### Configuration File

The `konfig.yaml` file sets up the environment, including the relevant account, region, cluster, namespace, and node group. It also configures each deployment, setting the name, chart, and source.

For backwards-compatibility reasons `konfigure` will recognize any file matching `{k,c}onfig.{yaml,json}`, but only `konfig.yaml` will be used moving forward.

##### Fields

- `apiVersion`: minimum version of `chitin` required
- `environment`: environment configuration
  - `awsAccount` (required): AWS account to use
  - `awsRegion` (optional): AWS region to use. if not set, detection will be attempted
  - `k8sContext` (required): pre-configured K8s context to use
  - `k8sNamespace` (required): K8s namespace to create/use
  - `eksNodegroup`: EKS nodegroup to deploy to
  - `tfEnv`: name of the Terraform environment
  - `tfModule`: Terraform module to reference
- `chartDefaults`: defaults to apply to any instance of a chart, fields same as `deployments`
  applies values to all deployments of a certain chart in an environment, ie versions, resources, etc
- `deployments` (required): workloads to be deployed, each is an instance of a chart with these fields:
  - `chart`: name/path of the chart to use
  - `type`: the type of chart (Helm/CDK8s) [default: Helm]
  - `source`: where to pull the chart from, options are:
    - `local`: local filesystem, expects a path (relative or absolute)
    - `artifactory`: pull from `fimbulvetr`, expects the repo to be configured with Helm
    - `remote`: pull from a remote repository
  - `version`: version of the chart to require [optional]
  - `values`: an inline values object, will be converted to YAML and passed to the chart [optional]
  - `disabled`: if set to `true`, causes this deployment to not be processed [default: false]
  - `cdDisabled`: if set to `true`, and the `cd` flag is set, causes this deployment to not be processed [default: false]
- `externalResources`: enables creation of K8s Services/Secrets to facilitate access to extra-cluster resources, ie databases, MSK clusters, Hetzner services, or external APIs
  - `secretPresets`: defines common `externalSecret` combinations which can be referenced in specific `externalResources.deployment`s using `$secretPreset`
  - `deployments`: instances of the `external-service` chart to be deployed, takes only values

##### Secrets Management

We use the [`external-secrets`](https://github.com/external-secrets/kubernetes-external-secrets) module to poplate K8s `Secret`s from parameters stored in AWS SSM, which allows us to avoid manually shuffling around sensitive values or accidentally committing them to Git. To use this functionality, we create an `ExternalSecret` resource with a map of secret key to SSM parameter path, and then reference the automatically created `Secret` using a `secretEnvMap` block or the equivalent.

Note that the `external-service` chart provides an easy way of setting up these resources by adding an item to the `externalResources.deployments` section, see the example below for details.

##### Subdirectory Mappings

- `chartDefaults`: files map to the equivalent config entry's `values` field
- `deployments`: files map to the equivalent config entry's `values` field
- `externalResources`: files map to the equivalent config entry's value (in the `deployments` subsection)

##### Overrides & Precedence

The subdirectories/files are simply a way to extract complex configuration from the main file, and are merged with inline config in this precedence order (higher overrides):

1. chart defaults (`values.yaml`)
2. `chartDefaults` (file)
3. `chartDefaults` (inline)
4. `deployments` (file)
5. `deployments` (inline)

##### Example

```yaml
apiVersion: 4.13.0
environment:
  tfEnv: dev
  tfModule: legacy-dev
  awsAccount: dev
  awsRegion: eu-east-1
  k8sContext: nonprod
  k8sNamespace: dev
  eksNodegroup: eu-east-1a-workers

chartDefaults:
  external-service:
    version: 0.1.0
  ethereum:
    version: 1.3.3
  backend:
    version: 0.5.4
    values:
      cluster:
        version: 6.47.0

deployments:
  eth-node:
    chart: ethereum
  eth2-node:
    chart: ethereum
  eth-backend:
    chart: backend
  eth-seeder:
    chart: ~/Developer/Projects/charts/charts/seeder
    source: local
  eth-producer:
    chart: producer
    version: 0.5.4
  some-other-app-instance:
    chart: some-other-app
    type: cdk8s
    version: 1.2.3

externalResources:
  secretPresets:
    preset-1:
      username: /dev/some-param/username
      password: /dev/some-param/password
  deployments:
    alchemy-eth:
      externalName: '[...].alchemy.com'
      externalSecrets:
        username: /dev/alchemy-eth/username
        password: /dev/alchemy-eth/password
    postgres-local:
      externalIP: 10.0.0.18
      externalPort: 5432
    postgres-eth:
      externalName: dev-eth.[...].rds.amazonaws.com
      $secretPreset: preset-1
    producer-kafka-1:
      externalName: b-1.kafka-nonprod-producer.[...].amazonaws.com
```
