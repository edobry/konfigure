import { Konfiguration } from "../src/konfiguration";
import { input, overriddenValues, testEnvConfig, testKonfigEnv, testEnvName, testKeyName, dummyCommand, makeKonfig, dep, chart, addDeployment, secretPreset, addSecretPreset, addExternalResource, externalResource, addChart } from "./testUtil";

const x = {
    [dep(1)]: {
        chart: chart(1)
    },
    [dep(2)]: {
        chart: chart(2)
    },
    [dep(3)]: {
        chart: chart(1),
        cdDisabled: true
    },
    [dep(4)]: {
        chart: chart(2),
        disabled: true
    }
};

test("parses konfig", () => {
    expect(new Konfiguration(testEnvName, testKonfigEnv, testEnvConfig())).toBeInstanceOf(Konfiguration);
});

test("parseInstances: handles local chart path", () => {
    expect(
        makeKonfig(addDeployment(1, {
            chart: `/local/path/to/${chart(1)}`,
            source: "local",
        })).instances[dep(1)].chart
    ).toEqual(chart(1));
});

test("parseExternalResources: handles secretPresets", () => {
    const secretPreset1 = {
        username: `/test/${secretPreset(1)}/username`,
        password: `/test/${secretPreset(1)}/password`,
    };

    const konfig = makeKonfig(
        addSecretPreset(1, secretPreset1),
        addExternalResource(1, {
            service: {
                name: "my-service-name.com",
            },
            $secretPreset: secretPreset(1),
        })
    );

    expect(
        konfig.instances[externalResource(1)].dep.values
    ).toMatchObject({
        externalSecrets: secretPreset1
    });
});

test("Instance.prepareValues: chart default values inherited", async () => {
    expect(
        await makeKonfig(
            addChart(1, {
                chart: chart(1),
                version: "1.1.0",
            }),
            addDeployment(1, {
                chart: chart(1),
            })
        ).instances[dep(1)].prepareValues({}, overriddenValues)
    ).toContain(overriddenValues);
});

test("Instance.prepareValues: inline chart default values override extenral chart default values", async () => {
    const chartInlineValues = { [testKeyName]: "testValue" };

    expect(
        await makeKonfig(
            addChart(1, {
                chart: chart(1),
                version: "1.1.0",
                values: chartInlineValues,
            }),
            addDeployment(1, {
                chart: chart(1),
            })
        ).instances[dep(1)].prepareValues({}, overriddenValues)
    ).toContain(chartInlineValues);
});

test("filterDeployments: matches all", () => {
    expect(
        makeKonfig(
            addChart(1, {
                chart: chart(1),
            }),
            addDeployment(1, {
                chart: chart(1),
            }),
            addDeployment(2, {
                chart: chart(1),
            }),
            addDeployment(3, {
                chart: chart(1),
            }),
            addDeployment(4, {
                chart: chart(1),
            }),
            addDeployment(5, {
                chart: chart(1),
            })
        ).filterDeployments(input({}, dummyCommand, "all"))
    ).toHaveLength(5);
});

test("filterDeployments: matches by chart", () => {
    expect(
        makeKonfig(
            addChart(1, {
                chart: chart(1),
            }),
            addChart(2, {
                chart: chart(2),
            }),
            addDeployment(1, {
                chart: chart(1),
            }),
            addDeployment(2, {
                chart: chart(2),
            })
        ).filterDeployments(input({}, dummyCommand, "chart", chart(1)))
    ).toHaveLength(1);
});

test("filterDeployments: matches by multiple charts", () => {
    expect(
        makeKonfig(
            addChart(1, {
                chart: chart(1),
            }),
            addChart(2, {
                chart: chart(2),
            }),
            addChart(3, {
                chart: chart(3),
            }),
            addDeployment(1, {
                chart: chart(1),
            }),
            addDeployment(2, {
                chart: chart(2),
            }),
            addDeployment(3, {
                chart: chart(3),
            })
        ).filterDeployments(input({}, dummyCommand, "chart", chart(1), chart(2)))
    ).toHaveLength(2);
});

test("filterDeployments: matches local chart", () => {
    expect(
        makeKonfig(
            addChart(1, {
                chart: chart(1),
            }),
            addDeployment(1, {
                chart: `/local/path/to/${chart(1)}`,
                source: "local",
            })
        ).filterDeployments(input({}, dummyCommand, "chart", chart(1)))
    ).toHaveLength(1);
});

test("filterDeployments: matches by single instance", () => {
    expect(
        makeKonfig(
            addChart(1, {
                chart: chart(1),
            }),
            addDeployment(1, {
                chart: chart(1),
            })
        ).filterDeployments(input({}, dummyCommand, dep(1)))
    ).toHaveLength(1);
});

test("filterDeployments: matches by multiple instances", () => {
    expect(
        makeKonfig(
            addChart(1, {
                chart: chart(1),
            }),
            addDeployment(1, {
                chart: chart(1),
            }),
            addDeployment(2, {
                chart: chart(1)
            })
        ).filterDeployments(input({}, dummyCommand, dep(1), dep(2)))
    ).toHaveLength(2);
});

test("filterDeployments: not match nonexistent", () => {
    expect(
        makeKonfig(
            addChart(1, {
                chart: chart(1),
            }),
            addDeployment(1, {
                chart: chart(1),
            }),
            addDeployment(2, {
                chart: chart(1)
            })
        ).filterDeployments(input({}, dummyCommand, "fake-dep"))
    ).toHaveLength(0);
});

test("filterDeployments: not match disabled", () => {
    expect(
        makeKonfig(
            addChart(1, {
                chart: chart(1),
            }),
            addDeployment(1, {
                chart: chart(1),
                disabled: true
            })
        ).filterDeployments(input({}, dummyCommand, dep(1)))
    ).toHaveLength(0);
});


test("filterDeployments: not match cdDisabled in ci mode", () => {
    expect(
        makeKonfig(
            addChart(1, {
                chart: chart(1),
            }),
            addDeployment(1, {
                chart: chart(1),
                cdDisabled: true,
            })
        ).filterDeployments(input({ cd: true }, dummyCommand, dep(1)))
    ).toHaveLength(0);
});
