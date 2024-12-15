import { IncomingMessage } from "http";
import { Configuration, CoreV1ApiCreateNamespaceRequest, CoreV1ApiReadNamespaceRequest, V1Namespace } from "@kubernetes/client-node";
import { Deployment } from "../src/konfiguration";
import { chart, dummyCommand, input, makeCtx, makeKonfig, testEnvDev } from "./testUtil";

const localChart: Deployment = {
    chart: `/local/path/to/${chart(1)}`,
    source: "local",
};

test("initNamespace: uses set namespace name if provided", async () => {
    const ctx = makeCtx(input({ cd: true }, dummyCommand), makeKonfig());

    const mockK8sApi = {
        readNamespace: jest.fn(
            async (
                param: CoreV1ApiReadNamespaceRequest,
                options?: Configuration | undefined
            ) => ({} as V1Namespace)
        ),
        createNamespace: jest.fn(
            async (
                param: CoreV1ApiCreateNamespaceRequest,
                options?: Configuration | undefined
            ) => ({} as V1Namespace)
        ),
    };

    await ctx.initNamespace(mockK8sApi);

    expect(mockK8sApi.readNamespace.mock.calls[0]).toContainEqual(testEnvDev);
});
