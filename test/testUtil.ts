import merge from "deepmerge";
import { files } from "node-dir";
import { CommandInput } from "../src/baseCommand";
import { CommandContext } from "../src/commandContext";
import { IFileIO } from "../src/fileIo";
import { Flags } from "../src/flags";
import { Deployment, Environment, ExternalResource, ExternalServiceChart, KonfigEnv, KonfigProps, Konfiguration, ValuesMap } from "../src/konfiguration";
import Logger from "../src/logger";
import { InteractiveShell } from "../src/shell";
import { deepSet } from "../src/util";

Logger.setGlobalLevel("error");

export const input = (flags: ValuesMap, ...argv: string[]): CommandInput<Flags> => ({
    flags,
    argv,
    args: [],
});

const awsRegion = "eu-west-1";
export const testEnvName = "test-env";
export const testEnvDev = `${testEnvName}-dev`;
export const testKonfigEnv: KonfigEnv = {
    filename: "konfig.json",
    dir: `env/${testEnvName}`
};

export const testKeyName = "testKey";
export const overriddenValues = { [testKeyName]: "overriddenValue" };

const testEnv = {
    tfEnv: testEnvDev,
    tfModule: testEnvDev,
    awsAccount: testEnvDev,
    awsRegion,
    k8sContext: `${testEnvName}-nonprod`,
    k8sNamespace: testEnvDev,
    eksNodegroup: `${testEnvName}-${awsRegion}a-workers`,
};
export const testEnvConfig = (environment: Environment = testEnv): KonfigProps => ({
    apiVersion: "v4.15.0",
    environment,
    chartDefaults: {},
    deployments: {},
    externalResources: {
        secretPresets: {},
        deployments: {},
    },
});

export type Mapper<T> = (x: T) => T;
export type KonfigMapper = Mapper<KonfigProps>;
export const makeKonfig = (...konfigMappers: Mapper<KonfigProps>[]) =>
    makeTestKonfig({ konfigMappers });

export const makeTestKonfig = (params: {
    konfigMappers: Mapper<KonfigProps>[];
    mockFileIO?: (envDir: string) => Record<string, ValuesMap>;
}) =>
    new Konfiguration(
        testEnvName,
        testKonfigEnv,
        params.konfigMappers.reduce((acc, map) => map(acc), testEnvConfig()),
        params.mockFileIO ? makeMockFileIO(params.mockFileIO(testKonfigEnv.dir)) :
            makeMockFileIO({})
    );

// TODO: untangle this mess
export const makeMockFileIO: (values: Record<string, ValuesMap>) => IFileIO = values => {
    return {
        readOptionalFile: jest.fn(async path => values[path] || {}),
        readFile: jest.fn(async path => values[path]),
    };
};

export const shell = {
    runCommand: jest.fn(async () => ({ exitcode: 0, output: "" })),
};
export const helmClient = {
    runHelmCommand: jest.fn(async () => {}),
    updateHelmRepos: jest.fn(async () => {}),
};

export const dummyCommand = "a-command";
export const makeCtx = <T extends Flags>(cmdInput?: CommandInput<T>, konfig?: Konfiguration) =>
    new CommandContext(Logger.root, cmdInput ?? input({}), {
        shell: shell as unknown as InteractiveShell,
        konfig: konfig || ({} as Konfiguration),
    });


export const addResource =
    <T extends object>(
        idFunc: ReturnType<typeof resourceName>,
        ...path: string[]
    ) =>
    (id: number, props: T): KonfigMapper =>
    (konfig: KonfigProps) => {
        deepSet(konfig, props, ...path, idFunc(id));
        return konfig;
    };


const resourceName = (name: string) => (id: number) => `${name}${id}`;

export const chart = resourceName("chart");
export const dep = resourceName("dep");
export const secretPreset = resourceName("secretPreset");
export const externalResource = resourceName("externalResource");

export const addChart = addResource<Deployment>(chart, "chartDefaults");
export const addDeployment = addResource<Deployment>(dep, "deployments");
export const addExternalResource = addResource<ExternalResource>(
    externalResource,
    "externalResources",
    "deployments"
);
export const addSecretPreset = addResource<ValuesMap>(
    secretPreset,
    "externalResources",
    "secretPresets"
);

const externalServiceChartSetter = addResource<Deployment>(() => ExternalServiceChart, "chartDefaults");
export const addExternalServiceChart = (props: Deployment) => externalServiceChartSetter(1, props);
