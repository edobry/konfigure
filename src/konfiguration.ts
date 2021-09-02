import { stripIndents, codeBlock } from 'common-tags'

interface KonfigProps {
    apiVersion: string,
    environment: Environment,
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
    version: string,
    source: string,
    values: { [index: string]: object }
    disabled: boolean,
    cdDisabled: boolean
}
interface NamedDeployment extends Deployment {
    name: string
}

interface ExternalResources {
    secretPresets:  { [index: string]: object },
    deployments:  { [index: string]: ExternalResource }
}

type StringMap = { [index: string]: string };

interface ExternalResource extends Deployment {
    service: StringMap,
    externalSecrets: StringMap,
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

            Deployments:

            ${Object.entries(this.konfig.deployments)
                .map(([name, dep]) =>
                    deploymentToString(name, dep))
                .join('\n\n')}
        `;  

        return output;
    }
};

function deploymentToString(name: string,
    { chart, version, source, disabled, cdDisabled, values }: Deployment
): string {
    let output = codeBlock`
        ${name}:
            Chart: ${chart}
    `;
    
    if(version)
        output += `\n    Version: ${version}`

    if(source)
        output += `\n    Source: ${source}`

    if(disabled)
        output += `\n    Disabled: ${disabled}`

    if(cdDisabled)
        output += `\n    CD Disabled: ${cdDisabled}`

    if(values && Object.keys(values).length !== 0)
        output += `\n    Values: ${JSON.stringify(values)}`

    return output;
}
