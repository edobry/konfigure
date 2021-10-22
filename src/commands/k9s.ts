import BaseCommand, { CommandContext, runDtCommand } from '../baseCommand';

export default class K9sCommand extends BaseCommand<typeof K9sCommand.flags> {
    static description = "launch k9s in the current environment";
    static strict = false

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command({ env, input }: CommandContext<typeof K9sCommand.flags>) {
        const { k8sContext, k8sNamespace } = env.konfig.environment;

        this.logger.infoBlank();
        this.logger.info(`Launching K9s in context '${k8sContext}', namespace '${k8sNamespace}'`);
        const k9sCommand = `k9s --context "${k8sContext}" --namespace "${k8sNamespace}" -c deployments`;

        if(input.flags.dryrun)
            this.logger.info(k9sCommand)
        else
            await runDtCommand(k9sCommand);
    }
};
