import { stripIndents, codeBlock } from 'common-tags'
import { pretty, printArgs } from './util';

interface KonfigProps {
    apiVersion: string,
    environment: Environment,
    chartDefaults: { [index: string]: Deployment }
    deployments: { [index: string]: Deployment },
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

interface Deployment {
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
    secretPreset: string
}

export class Konfiguration {
    constructor(public name: string, private konfig: KonfigProps) {
        
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

function deploymentToString(name: string,
    { chart, version, source, disabled, cdDisabled, values }: Deployment
): string {
    // let output = '';
    
    // if(chart)
    //     output += `\n    Chart: ${chart}`;
    
    // if(version)
    //     output += `\n    Version: ${version}`

    // if(source)
    //     output += `\n    Source: ${source}`

    // if(disabled)
    //     output += `\n    Disabled: ${disabled}`

    // if(cdDisabled)
    //     output += `\n    CD Disabled: ${cdDisabled}`

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
    { service, secretPreset, externalSecrets }: ExternalResource
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
