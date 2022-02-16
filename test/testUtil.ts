import { Environment } from "../src/commandContext";
import { KonfigProps, Konfiguration, ValuesMap } from "../src/konfiguration";

export const input = (flags: ValuesMap, ...argv: string[]) => ({
    flags,
    argv,
    args: [],
});

const awsRegion = "eu-west-1";
export const testEnvName = "test-env";
export const testEnvDev = `${testEnvName}-dev`;
export const testEnvDir = `env/${testEnvName}`;


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
export const testEnvConfig = (): KonfigProps => ({
    apiVersion: "v4.15.0",
    environment: testEnv,
    chartDefaults: {},
    deployments: {},
    externalResources: {
        secretPresets: {},
        deployments: {},
    },
});

export const makeKonfig = () =>
    new Konfiguration(testEnvName, testEnvDir, testEnvConfig());
