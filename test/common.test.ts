import { processDeployments } from "../src/common";
import { Deployment } from "../src/konfiguration";
import { addDeployment, chart, dummyCommand, helmClient, input, makeCtx, makeKonfig } from "./testUtil";


const localChart: Deployment = {
    chart: `/local/path/to/${chart(1)}`,
    source: "local",
};

test("processDeployments: update helm repos when nonlocal source helm charts", async () => {
    const konfig = makeKonfig(
        addDeployment(1, localChart),
        addDeployment(2, {
            chart: chart(1),
        })
    );

    await processDeployments(
        makeCtx(input({}, dummyCommand, "all"), konfig),
        async (c) => {},
        false,
        helmClient
    );

    expect(helmClient.updateHelmRepos).toHaveBeenCalledTimes(1);
});

test("processDeployments: dont update helm repos when only local source helm charts", async () => {
    const konfig = makeKonfig(addDeployment(1, localChart));

    await processDeployments(
        makeCtx(input({}, dummyCommand, "all"), konfig),
        async (c) => {},
        false,
        helmClient
    );

    expect(helmClient.updateHelmRepos).toHaveBeenCalledTimes(0);
});

test("processDeployments: dont update helm repos when only cdk8s charts", async () => {
    const konfig = makeKonfig(
        addDeployment(1, {
            chart: chart(1),
            type: "cdk8s",
        })
    );

    await processDeployments(
        makeCtx(input({}, dummyCommand, "all"), konfig),
        async (c) => {},
        false,
        helmClient
    );

    expect(helmClient.updateHelmRepos).toHaveBeenCalledTimes(0);
});
