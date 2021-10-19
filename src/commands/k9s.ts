import { initEnv } from '../common';
import { runDtCommand } from '../shell';
import BaseCommand from '../baseCommand';

export default class K9s extends BaseCommand {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async run(): Promise<void> {
        this.printMode(this.input!, this.constructor);

        const env = await initEnv(this.input!);
        await env.shell.close();

        const { k8sContext, k8sNamespace } = env.konfig.environment;

        console.log(`Launching K9s in context '${k8sContext}', namespace '${k8sNamespace}'`);
        await runDtCommand(`k9s --context "${k8sContext}" --namespace "${k8sNamespace}" -c deployments`);
    }
}
