import { CommandContext } from "../src/commandContext";
import { HelmChart, HelmClient } from "../src/helm";
import { Instance, Konfiguration, ValuesMap } from "../src/konfiguration";
import Logger from "../src/logger";
import { InteractiveShell } from "../src/shell";
import { input, makeKonfig } from "./testUtil";

const shell = {
    runCommand: jest.fn(async () => ({ exitcode: 0, output: "" })),
};

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


const makeCtx = (flags: ValuesMap, konfig?: Konfiguration) =>
    new CommandContext(Logger.root, input(flags), {
        shell: shell as unknown as InteractiveShell,
        konfig: konfig || {} as Konfiguration,
    });

test("helmClient: updateHelmRepos calls repo update command", async () => {
    await new HelmClient().updateHelmRepos(
        makeCtx({}));
        
    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining("repo update"));
});

test("helmClient: updateHelmRepos passes flags thru", async () => {
    await new HelmClient().updateHelmRepos(
        makeCtx({ debug: true }));

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining("--debug"));
});

const makeChart = (konfig: Konfiguration, flags?: ValuesMap) => {
    const chartName = "test-chart";
    const instance = new Instance(
        "test-instance",
        { chart: chartName },
        konfig
    );
    return new HelmChart(chartName, instance, {}, makeCtx(flags ?? {}, konfig));
};

test("helmChart: runChartCommand prepends command args", async () => {
    const konfig = makeKonfig();
    await makeChart(konfig).runChartCommand([testArg]);

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringMatching(`^helm ${testArg}`));
});

test("helmChart: runChartCommand sets context", async () => {
    const konfig = makeKonfig();
    await makeChart(konfig).runChartCommand([""]);

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining(`--kube-context ${konfig.props.environment.k8sContext}`));
});

test("helmChart: runChartCommand sets namespace", async () => {
    const konfig = makeKonfig();
    await makeChart(konfig).runChartCommand([""]);

    expect(shell.runCommand).toHaveBeenCalledWith(
        expect.stringContaining(`--namespace ${konfig.props.environment.k8sNamespace}`));
});
