import { stripIndents, codeBlock } from 'common-tags'
import { pretty, printArgs } from './util';

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
    source?: "local" | "artifactory" | "remote",
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

type ValuesMap = { [index: string]: string | number | ValuesMap };

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

export class Konfiguration {
    private deployments: DeploymentMap;

    constructor(public name: string, private konfig: KonfigProps) {
        this.deployments = {
            ...mergeChartDefaults(konfig.deployments, konfig.chartDefaults),
            ...parseExternalResources(konfig.externalResources)
        }
    }

    get environment() {
        return this.konfig.environment;
    }

    getChartDefaults(chartName: string): Deployment | undefined {
        return this.konfig.chartDefaults[chartName];
    }

    filterDeployments(filter: string[]) {
        let instancePredicate: (deployment: [string, Deployment]) => boolean;

        if(filter[0] == "all") {
            console.log("Processing all deployments")
            
            if(filter.length > 1)
                console.warn("Additional instances specified after 'all' keyword, will be ignored.\n")
            
            instancePredicate = () => true;
        } else if(filter[0] == "chart") {
            const chartFilter = filter.slice(1).join(', ');
            console.log(`Limiting to instances of chart(s): ${chartFilter}`);
            instancePredicate = ([, deployment]) => chartFilter.includes(deployment.chart);
        }
        else {
            console.log(`Limiting to: ${filter.join(', ')}`);
            instancePredicate = ([name]) => filter.includes(name);
        }

        return Object.entries(this.deployments)
            .filter(instancePredicate)
            .filter(([, { disabled }]) =>
                !disabled);
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

    console.log("the test")
    console.log(test)

    return pretty`
        ${name}:
            ${test}
    `;
}
