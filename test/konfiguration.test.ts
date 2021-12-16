import { KonfigProps, Konfiguration } from "../src/konfiguration";

const awsRegion = "eu-west-1";
const testEnvName = "test-env";
const testEnvDev = `${testEnvName}-dev`;
const testEnvDir = `env/${testEnvName}`;

const chart1Name = "chart1";
const chart2Name = "chart2";
const chart3Name = "chart3";
const dep1Name = "dep1";
const dep2Name = "dep2";
const dep3Name = "dep3";
const dep4Name = "dep4";
const dep5Name = "dep5";

const testEnvConfig: KonfigProps = {
    apiVersion: "v4.15.0",
    environment: {
        tfEnv: testEnvDev,
        tfModule: testEnvDev,
        awsAccount: testEnvDev,
        awsRegion,
        k8sContext: `${testEnvName}-nonprod`,
        k8sNamespace: testEnvDev,
        eksNodegroup: `${testEnvName}-${awsRegion}a-workers`,
    },
    chartDefaults: {
        chart1: {
            chart: chart1Name,
            version: "1.1.0",
        },
    },
    deployments: {
        [dep1Name]: {
            chart: chart1Name,
        },
        [dep2Name]: {
            chart: chart2Name,
        },
        [dep3Name]: {
            chart: chart1Name,
            cdDisabled: true,
        },
        [dep4Name]: {
            chart: chart2Name,
            disabled: true,
        },
        [dep5Name]: {
            chart: `/local/path/to/${chart3Name}`,
            source: "local",
        },
    },
    externalResources: {
        deployments: {},
    },
};

const dummyCommand = "a-command";

test("parses konfig", () => {
    expect(new Konfiguration(testEnvName, testEnvDir, testEnvConfig)).toBeInstanceOf(Konfiguration);
});

test("filterDeployments: matches all", () => {
    const konfig = new Konfiguration(testEnvName, testEnvDir, testEnvConfig);

    expect(
        konfig.filterDeployments({
            argv: [dummyCommand, "all"],
            args: {},
            flags: {}
        })
    ).toHaveLength(4);
});

test("filterDeployments: matches by chart", () => {
    const konfig = new Konfiguration(testEnvName, testEnvDir, testEnvConfig);

    expect(
        konfig.filterDeployments({
            argv: [dummyCommand, "chart", chart1Name],
            args: {},
            flags: {}
        })
    ).toHaveLength(2);
});

test("filterDeployments: matches by multiple charts", () => {
    const konfig = new Konfiguration(testEnvName, testEnvDir, testEnvConfig);

    expect(
        konfig.filterDeployments({
            argv: [dummyCommand, "chart", chart1Name, chart2Name],
            args: {},
            flags: {},
        })
    ).toHaveLength(3);
});

test("filterDeployments: matches local chart", () => {
    const konfig = new Konfiguration(testEnvName, testEnvDir, testEnvConfig);

    expect(
        konfig.filterDeployments({
            argv: [dummyCommand, "chart", chart3Name],
            args: {},
            flags: {},
        })
    ).toHaveLength(1);
});

test("filterDeployments: matches by single instance", () => {
    const konfig = new Konfiguration(testEnvName, testEnvDir, testEnvConfig);

    expect(
        konfig.filterDeployments({
            argv: [dummyCommand, dep1Name],
            args: {},
            flags: {}
        })
    ).toHaveLength(1);
});

test("filterDeployments: matches by multiple instances", () => {
    const konfig = new Konfiguration(testEnvName, testEnvDir, testEnvConfig);

    expect(
        konfig.filterDeployments({
            argv: [dummyCommand, dep1Name, dep2Name],
            args: {},
            flags: {}
        })
    ).toHaveLength(2);
});

test("filterDeployments: not match nonexistent", () => {
    const konfig = new Konfiguration(testEnvName, testEnvDir, testEnvConfig);

    expect(
        konfig.filterDeployments({
            argv: [dummyCommand, "fake-dep"],
            args: {},
            flags: {}
        })
    ).toHaveLength(0);
});

test("filterDeployments: not match disabled", () => {
    const konfig = new Konfiguration(testEnvName, testEnvDir, testEnvConfig);

    expect(
        konfig.filterDeployments({
            argv: [dummyCommand, dep4Name],
            args: {},
            flags: {}
        })
    ).toHaveLength(0);
});

test("filterDeployments: not match cdDisabled in ci mode", () => {
    const konfig = new Konfiguration(testEnvName, testEnvDir, testEnvConfig);

    expect(
        konfig.filterDeployments({
            argv: [dummyCommand, dep3Name],
            args: {},
            flags: {
                cd: true
            }
        })
    ).toHaveLength(0);
});
