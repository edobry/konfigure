import { HelmChart, HelmClient, IHelmClient } from "../src/helm";
import { Deployment, Instance, Konfiguration, ValuesMap } from "../src/konfiguration";
import { helmClient, input, makeCtx, makeKonfig, shell } from "./testUtil";

test("helmClient: runHelmCommand does not run command on dryrun flag", async () => {
    await new HelmClient().runHelmCommand(shell, true, false);
    expect(shell.runCommand.mock.calls.length).toBe(0);
});

test("helmClient: runHelmCommand handles debug flag", async () => {
    await new HelmClient().runHelmCommand(shell, false, true);
    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining("--debug"));
});

const testArg = "test-arg";

test("helmClient: runHelmCommand appends helmArgs to command", async () => {
    await new HelmClient().runHelmCommand(shell, false, false, testArg);
    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining(testArg));
});

test("helmClient: updateHelmRepos calls repo update command", async () => {
    await new HelmClient().updateHelmRepos(
        makeCtx());

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining("repo update"));
});

test("helmClient: updateHelmRepos passes flags thru", async () => {
    await new HelmClient().updateHelmRepos(
        makeCtx(input({ debug: true })));

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining("--debug"));
});

const chartName = "test-chart";
const instanceName = "test-instance";
const makeChart = (name: string, dep: Deployment, konfig: Konfiguration, flags?: ValuesMap, client?: IHelmClient) => {
    const instance = new Instance(
        name,
        dep,
        konfig
    );
    return new HelmChart(chartName, instance, {}, makeCtx(input(flags ?? {}), konfig), client);
};
const makeSimpleChart = (
    konfig: Konfiguration,
    flags?: ValuesMap,
    client?: IHelmClient
) => {
    return makeChart(instanceName, { chart: chartName }, konfig, flags, client);
};

test("helmChart: runChartCommand prepends command args", async () => {
    const konfig = makeKonfig();
    await makeSimpleChart(konfig).runChartCommand([testArg]);

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringMatching(`^helm ${testArg}`));
});

test("helmChart: runChartCommand sets context", async () => {
    const konfig = makeKonfig();
    await makeSimpleChart(konfig).runChartCommand([""]);

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining(`--kube-context ${konfig.props.environment.k8sContext}`));
});

test("helmChart: runChartCommand sets namespace", async () => {
    const konfig = makeKonfig();
    await makeSimpleChart(konfig).runChartCommand([""]);

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining(`--namespace ${konfig.props.environment.k8sNamespace}`));
});

test("helmChart: runChartCommand passes in chart name", async () => {
    const konfig = makeKonfig();
    await makeSimpleChart(konfig).runChartCommand([""]);

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining(chartName));
});

test("helmChart: runChartCommand appends extra args", async () => {
    const konfig = makeKonfig();
    await makeSimpleChart(konfig).runChartCommand([""], testArg);

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringMatching(`${testArg} 2>&1$`));
});

test("helmChart: runChartCommand filters out empty args", async () => {
    const konfig = makeKonfig();
    await makeSimpleChart(konfig).runChartCommand([""], testArg);

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.not.stringMatching("  "));
});

//TODO: refactor to test calls on HelmClient instead
test("helmChart: runChartCommand passes flags thru", async () => {
    const konfig = makeKonfig();
    await makeSimpleChart(konfig, { debug: true }).runChartCommand([""], testArg);

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining("--debug"));
});

test("helmChart: uninstall runs command", async () => {
    const konfig = makeKonfig();
    await makeSimpleChart(konfig, {}).uninstall();

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining("uninstall"));
});

test("helmChart: local charts handled", async () => {
    const chartPath = `/path/to/chart/${chartName}`;

    const konfig = makeKonfig();
    await makeChart(instanceName, {
        chart: chartPath,
        source: "local"
    }, konfig, {}, helmClient).runChartValuesCommand();

    expect(helmClient.runHelmCommand.mock.calls[0]).toContainEqual(chartPath);
});
