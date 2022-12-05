import { CoreV1Api, V1Namespace } from "@kubernetes/client-node";
import { IncomingMessage } from "http";
import { CommandContext } from "../src/baseCommand";
import { K8sNamespaceApi } from "../src/commandContext";
import { processDeployments } from "../src/common";
import { Deployment, Konfiguration } from "../src/konfiguration";
import { addDeployment, chart, dummyCommand, helmClient, input, makeCtx, makeKonfig, testEnvConfig, testEnvDev, testEnvName, testKonfigEnv } from "./testUtil";

const localChart: Deployment = {
    chart: `/local/path/to/${chart(1)}`,
    source: "local",
};

test("initNamespace: uses set namespace name if provided", async () => {
    const ctx = makeCtx(input({ cd: true }, dummyCommand), makeKonfig());

    const mockK8sApi = {
        readNamespace: jest.fn(async (name: string) => ({
            response: {} as IncomingMessage,
            body: {} as V1Namespace,
        })),
        createNamespace: jest.fn(
            async (spec: V1Namespace) => ({
                response: {} as IncomingMessage,
                body: {} as V1Namespace,
            })
        ),
    };

    await ctx.initNamespace(mockK8sApi);

    expect(mockK8sApi.readNamespace.mock.calls[0]).toContainEqual(testEnvDev);
});
