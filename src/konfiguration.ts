import * as path from "path";

import { codeBlock } from 'common-tags'

import { pretty, printArgs, readFile, readOptionalFile } from './util';
import { CommandInput } from "./baseCommand";
import { Flags } from "./flags";
import Logger from "./logger";

type DeploymentMap = { [index: string]: Deployment };

interface KonfigProps {
    apiVersion: string,
    environment: Environment,
    chartDefaults: DeploymentMap
    deployments: DeploymentMap,
    externalResources: ExternalResources
}

interface Environment {
    name: string,
    tfEnv: string,
    tfModule: string,
    awsAccount: string,
    awsRegion: string,
    k8sContext: string,
    k8sNamespace: string,
    eksNodegroup: string
}

export interface Deployment {
    chart: string,
    type?: "helm" | "cdk8s"
    source?: "local" | "remote",
    version?: string,
    values?: { [index: string]: string | number | ValuesMap }
    disabled?: boolean,
    cdDisabled?: boolean,
    nestValues?: boolean
}
interface NamedDeployment extends Deployment {
    name: string
}

interface ExternalResources {
    secretPresets:  { [index: string]: object },
    deployments:  { [index: string]: ExternalResource }
}

export type ValuesMap = { [index: string]: string | number | ValuesMap };

interface ExternalResource {
    service: {
        name?: string,
        address?: string,
        port?: number
    },
    externalSecrets: ValuesMap,
    $secretPreset: string
}

function parseExternalResources(resources: ExternalResources): DeploymentMap {
    return Object.fromEntries(Object.entries(resources.deployments).map(([name, resource]) => [name, {
        chart: "external-service",
        values: {
            ...resource,
            ...resources.secretPresets[resource.$secretPreset]
        } as unknown as ValuesMap
    }]));
}

function mergeChartDefaults(deployments: DeploymentMap, defaults: DeploymentMap): DeploymentMap {
    return Object.fromEntries(Object.entries(deployments).map(([name, deployment]) => {
        const { values = {}, ...chartDefaults } = defaults[deployment.chart] || {};

        return [name, {
            ...chartDefaults,
            ...deployment
        }]
    }));
}

const konfigLogger = new Logger("Konfiguration");

export class Konfiguration {
    private deployments: DeploymentMap;
    private log: Logger;

    constructor(public name: string, private envDir: string,
         private konfig: KonfigProps) {
        this.log = new Logger(`Konfiguration:env/${name}`);
        this.deployments = {
            ...mergeChartDefaults(konfig.deployments, konfig.chartDefaults),
            ...parseExternalResources(konfig.externalResources)
        }
    }
    
    static async read(envName: string) {
        konfigLogger.infoBlank();
        konfigLogger.info("Reading konfiguration...");

        const currentDir = process.cwd();
        const envDir = path.join(currentDir, `env/${envName}`);

        const konfig = await readFile(path.join(envDir, "konfig.json"));
        // TODO: implement file schema validation
        return new Konfiguration(envName, envDir, konfig as unknown as KonfigProps);
    }

    async readChartDefaultValues(chart: string) {
        return readOptionalFile(path.join(this.envDir, `chartDefaults/${chart}.yaml`));
    }

    async readDeploymentValues(deployment: string) {
        return readOptionalFile(path.join(this.envDir, `deployments/${deployment}.yaml`));
    }

    // TODO: implement?
    // async readExternalResourceValues(resource: string) {
    //     const deploymentValuesFile = await fs.readFile(path.join(this.envDir, `deployments/${deployment}.yaml`), { encoding: "UTF-8" });
    //     const deploymentValues = JSON.parse(deploymentValuesFile);

    //     return deploymentValues;
    // }

    get environment() {
        return this.konfig.environment;
    }

    getChartDefaults(chartName: string): Deployment | undefined {
        return this.konfig.chartDefaults[chartName];
    }

    filterDeployments<T extends Flags>(input: CommandInput<T>) {
        let instancePredicate: (deployment: [string, Deployment]) => boolean;

        const filter: string[] = input.argv.slice(1);

        konfigLogger.infoBlank();
        if(filter[0] == "all") {
            this.log.info("Processing all deployments")
            
            if(filter.length > 1)
                console.warn("Additional instances specified after 'all' keyword, will be ignored.\n")
            
            instancePredicate = () => true;
        } else if(filter[0] == "chart") {
            const charts = filter.slice(1);
            const chartFilter = charts.join(', ');
            this.log.info(`Limiting to instances of chart${charts.length > 1 ? 's' : ''}: ${chartFilter}`);
            instancePredicate = ([, deployment]) => chartFilter.includes(deployment.chart);
        }
        else {
            this.log.info(`Limiting to: ${filter.join(', ')}`);
            instancePredicate = ([name]) => filter.includes(name);
        }

        return Object.entries(this.deployments)
            .filter(instancePredicate)
            .filter(([, { disabled, cdDisabled }]) => {
                return !disabled && !(input.flags.cd && cdDisabled)
            });
    }

    logHeader() {
        this.log.info(`konfiguration ${this.konfig.apiVersion}`);
        konfigLogger.infoBlank()
        this.log.info(`Initializing DP environment '${this.name}'...`);
        this.log.info(`Terraform environment: '${this.konfig.environment.tfEnv}'`);
        this.log.info(`AWS account: '${this.konfig.environment.awsAccount}'`);
        this.log.info(`AWS region: '${this.konfig.environment.awsRegion}'`);
        this.log.info(`K8s context: '${this.konfig.environment.k8sContext}'`);
        this.log.info(`K8s namespace: '${this.konfig.environment.k8sNamespace}'`);
    }

    header(): string {
        return codeBlock`
            konfiguration ${this.konfig.apiVersion}

            Initializing DP environment '${this.name}'...
            Terraform environment: '${this.konfig.environment.tfEnv}'
            AWS account: '${this.konfig.environment.awsAccount}'
            AWS region: '${this.konfig.environment.awsRegion}'
            K8s context: '${this.konfig.environment.k8sContext}'
            K8s namespace: '${this.konfig.environment.k8sNamespace}'
        `;
    }

    toString(): string {
        let output = codeBlock`
            ${this.header()}

            Chart defaults:

                ${Object.entries(this.konfig.chartDefaults)
                    .map(([name, dep]) =>
                        deploymentToString(name, dep))
                    .join('\n\n')}

            Deployments:

                ${Object.entries(this.konfig.deployments)
                    .map(([name, dep]) =>
                        deploymentToString(name, dep))
                    .join('\n\n')}
            
            External resources:

                ${Object.entries(this.konfig.externalResources.deployments)
                    .map(([name, resource]) =>
                        externalResourceToString(name, resource))
                    .join('\n\n')}
        `;  

        return output;
    }
};

function externalResourceToDeployment(resource: ExternalResource): Deployment {
    return {
        chart: "external-service",
        values: { ...resource }
        
    }
}

export function deploymentToString(name: string,
    { chart, version, source, disabled, cdDisabled, values }: Deployment
): string {
    return pretty`
        ${name}:
            ${printArgs({
                "Chart": chart,
                "Version": version,
                "Source": source,
                "Disabled": disabled,
                "CD Disabled": cdDisabled,
                "Values": values
            })}
    `;
}

function externalResourceToString(name: string,
    { service, $secretPreset, externalSecrets }: ExternalResource
): string {
    const test = printArgs({
                "Service": service,
                "Secrets": externalSecrets})

    // console.log("the test")
    // console.log(test)

    return pretty`
        ${name}:
            ${test}
    `;
}
