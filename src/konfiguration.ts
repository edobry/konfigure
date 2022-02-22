import * as path from "path";

import { codeBlock } from "common-tags";

import * as fs from "fs-extra";
import { CommandInput } from "./baseCommand";
import { Flags } from "./flags";
import Logger from "./logger";
import { pretty, printArgs, readFile, readOptionalFile } from "./util";

type DeploymentMap = { [index: string]: Deployment };
type InstanceMap = { [index: string]: Instance };

export interface KonfigProps {
    apiVersion: string;
    environment: Environment;
    chartDefaults: DeploymentMap;
    deployments: DeploymentMap;
    externalResources: ExternalResources;
}

interface Environment {
    name?: string;
    tfEnv: string;
    tfModule: string;
    awsAccount: string;
    awsRegion: string;
    k8sContext: string;
    k8sNamespace: string;
    eksNodegroup: string;
}

export class Instance {
    constructor(
        public name: string,
        public dep: Deployment,
        private konfig: Konfiguration
    ) {}

    get chart() {
        return this.dep.source == "local"
            ? path.basename(this.dep.chart)
            : this.dep.chart;
    }

    isEnabled(input: CommandInput<any>): boolean {
        const { disabled, cdDisabled } = this.dep;

        return !disabled && !(input.flags.cd && cdDisabled);
    }

    async prepareValues(envValues: ValuesMap, chartDefaultValues?: ValuesMap, deploymentValues?: ValuesMap): Promise<ValuesMap[]> {
        const chartDefaultValuesP = chartDefaultValues
            ?? this.konfig.readChartDefaultValues(this.dep.chart);
        const deploymentValuesP = deploymentValues
            ?? this.konfig.readDeploymentValues(this.name);

        // TODO: implement unit test
        // precedence order
        //
        // chart default
        //
        // per env chart default (file)
        // per env chart default (inline)
        // deployment (file)
        // deployment (inline)

        return [
            envValues,
            await chartDefaultValuesP,
            this.konfig.getChartDefaults(this.dep.chart)?.values || {},
            await deploymentValuesP,
            this.dep.values || {},
        ];
    }
}
export interface Deployment {
    chart: string;
    type?: "helm" | "cdk8s";
    source?: "local" | "remote";
    version?: string;
    values?: ValuesMap;
    disabled?: boolean;
    cdDisabled?: boolean;
    nestValues?: boolean;
}
interface NamedDeployment extends Deployment {
    name: string;
}

export interface ExternalResources {
    secretPresets?: { [index: string]: object };
    deployments: { [index: string]: ExternalResource };
}

export type ValuesMap = { [index: string]: string | number | boolean | ValuesMap };

export interface ExternalResource {
    service?: {
        name?: string;
        address?: string;
        port?: number;
    };
    externalSecrets?: ValuesMap;
    $secretPreset?: string;
}

const konfigLogger = new Logger("Konfiguration");

export type KonfigEnv = {
    dir: string;
    filename: string;
}

export class Konfiguration {
    static getKonfigPath(konfigEnv: KonfigEnv) {
        return path.join(konfigEnv.dir, konfigEnv.filename);
    }

    static async read(envName: string, baseDir?: string) {
        konfigLogger.infoBlank();
        konfigLogger.info("Reading konfiguration...");

        const konfigEnv = await Konfiguration.detectKonfigFile(
            envName,
            baseDir
        );
        const konfig = await readFile(Konfiguration.getKonfigPath(konfigEnv));

        // TODO: implement file schema validation
        return new Konfiguration(
            envName,
            konfigEnv,
            konfig as unknown as KonfigProps
        );
    }

    static async detectKonfigFile(
        envName: string,
        baseDir?: string
    ): Promise<KonfigEnv> {
        const dir = baseDir ?? process.cwd();
        const envDir = path.join(dir, `env/${envName}`);

        try {
            const filename = "konfig.json";
            await fs.access(path.join(envDir, filename), fs.constants.R_OK);
            return { filename, dir: envDir };
        } catch (e) {
            try {
                const filename = "config.json";
                await fs.access(path.join(envDir, filename), fs.constants.R_OK);
                return { filename, dir: envDir };
            } catch (e2) {
                const { code } = e2 as Error & { code: "ENOENT" };

                if(code == "ENOENT")
                    Logger.root.error(
                        `No konfiguration file found for the ${envName} environment!`
                    );
                else
                    Logger.root.error(e2 as string);

                process.exit(1);
            }
        }
    }

    static parseInstances(konfig: Konfiguration): InstanceMap {
        return Object.fromEntries(
            Object.entries(konfig.props.deployments).map(
                ([name, deployment]) => {
                    const { values = {}, ...chartDefaults } =
                        konfig.props.chartDefaults[deployment.chart] || {};

                    return [
                        name,
                        new Instance(
                            name,
                            {
                                ...chartDefaults,
                                ...deployment,
                            },
                            konfig
                        ),
                    ];
                }
            )
        );
    }

    static parseExternalResources(konfig: Konfiguration): InstanceMap {
        const resources: ExternalResources = konfig.props.externalResources;

        return Object.fromEntries(
            Object.entries(resources.deployments).map(([name, resource]) => [
                name,
                new Instance(name, {
                    chart: "external-service",
                    values: {
                        ...resource,
                        // TODO: test this
                        externalSecrets: resource.$secretPreset
                            ? (resources.secretPresets || {})[
                                resource.$secretPreset
                            ]
                            : {},
                    } as unknown as ValuesMap,
                },
                konfig),
            ])
        );
    }

    public instances: InstanceMap;
    private log: Logger;

    constructor(
        public name: string,
        public konfigEnv: KonfigEnv,
        public props: KonfigProps
    ) {
        this.log = new Logger(`Konfiguration:env/${name}`);
        this.instances = {
            ...Konfiguration.parseInstances(this),
            ...Konfiguration.parseExternalResources(this),
        };
    }

    get konfigPath() {
        return Konfiguration.getKonfigPath(this.konfigEnv);
    }

    async readChartDefaultValues(chart: string) {
        return readOptionalFile(
            path.join(this.konfigEnv.dir, `chartDefaults/${chart}.yaml`)
        );
    }

    async readDeploymentValues(deployment: string) {
        return readOptionalFile(
            path.join(this.konfigEnv.dir, `deployments/${deployment}.yaml`)
        );
    }

    // TODO: implement?
    // async readExternalResourceValues(resource: string) {
    //     const deploymentValuesFile = await fs.readFile(path.join(this.konfigEnv.dir, `deployments/${deployment}.yaml`), { encoding: "UTF-8" });
    //     const deploymentValues = JSON.parse(deploymentValuesFile);

    //     return deploymentValues;
    // }

    get environment() {
        return this.props.environment;
    }

    getChartDefaults(chartName: string): Deployment | undefined {
        return this.props.chartDefaults[chartName];
    }

    filterDeployments<T extends Flags>(input: CommandInput<T>) {
        let instancePredicate: (deployment: [string, Deployment]) => boolean;

        const filter: string[] = input.argv.slice(1);

        konfigLogger.infoBlank();
        if(filter[0] == "all") {
            this.log.info("Processing all deployments");

            if(filter.length > 1)
                this.log.warn(
                    "Additional instances specified after 'all' keyword, will be ignored.");

            instancePredicate = () => true;
        } else if(filter[0] == "chart") {
            const charts = filter.slice(1);
            const chartFilter = charts.join(", ");
            this.log.info(
                `Limiting to instances of chart${
                    charts.length > 1 ? "s" : ""
                }: ${chartFilter}`
            );
            instancePredicate = ([, instance]) =>
                chartFilter.includes(instance.chart);
        } else {
            this.log.info(`Limiting to: ${filter.join(", ")}`);
            instancePredicate = ([name]) => filter.includes(name);
        }

        return Object.entries(this.instances)
            .filter(instancePredicate)
            .filter(([, instance]) => instance.isEnabled(input));
    }

    logHeader() {
        this.log.info(`konfiguration ${this.props.apiVersion}`);
        konfigLogger.infoBlank();
        this.log.info(`Initializing DP environment '${this.name}'...`);
        this.log.info(
            `Terraform environment: '${this.props.environment.tfEnv}'`
        );
        this.log.info(`AWS account: '${this.props.environment.awsAccount}'`);
        this.log.info(`AWS region: '${this.props.environment.awsRegion}'`);
        this.log.info(`K8s context: '${this.props.environment.k8sContext}'`);
        this.log.info(
            `K8s namespace: '${this.props.environment.k8sNamespace}'`
        );
    }

    header(): string {
        return codeBlock`
            konfiguration ${this.props.apiVersion}

            Initializing DP environment '${this.name}'...
            Terraform environment: '${this.props.environment.tfEnv}'
            AWS account: '${this.props.environment.awsAccount}'
            AWS region: '${this.props.environment.awsRegion}'
            K8s context: '${this.props.environment.k8sContext}'
            K8s namespace: '${this.props.environment.k8sNamespace}'
        `;
    }

    toString(): string {
        let output = codeBlock`
            ${this.header()}

            Chart defaults:

                ${Object.entries(this.props.chartDefaults)
                    .map(([name, dep]) => deploymentToString(name, dep))
                    .join("\n\n")}

            Deployments:

                ${Object.entries(this.props.deployments)
                    .map(([name, dep]) => deploymentToString(name, dep))
                    .join("\n\n")}
            
            External resources:

                ${Object.entries(this.props.externalResources.deployments)
                    .map(([name, resource]) =>
                        externalResourceToString(name, resource)
                    )
                    .join("\n\n")}
        `;

        return output;
    }
};

function externalResourceToDeployment(resource: ExternalResource): Deployment {
    return {
        chart: "external-service",
        values: { ...resource }
    };
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
        Service: service,
        Secrets: externalSecrets
    });

    // console.log("the test")
    // console.log(test)

    return pretty`
        ${name}:
            ${test}
    `;
}
