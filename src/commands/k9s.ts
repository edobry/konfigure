import { Environment } from '../common';
import { runDtCommand } from '../shell';
import BaseCommand, { CommandInput } from '../baseCommand';

export default class K9s extends BaseCommand {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(env: Environment, input: CommandInput<typeof K9s.flags>) {
        const { k8sContext, k8sNamespace } = env.konfig.environment;

        console.log(`Launching K9s in context '${k8sContext}', namespace '${k8sNamespace}'`);
        await runDtCommand(`k9s --context "${k8sContext}" --namespace "${k8sNamespace}" -c deployments`);
    }
}
