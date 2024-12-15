import BaseCommand, { CommandContext, runChiCommand } from "../baseCommand.ts";

export default class K9sCommand extends BaseCommand<
    typeof K9sCommand.flags,
    typeof K9sCommand.args
> {
    static description = "launch k9s in the current environment";
    static strict = false;

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(
        ctx: CommandContext<
            typeof K9sCommand.flags,
            typeof K9sCommand.args
        >
    ) {
        const {
            env: {
                konfig: {
                    environment: { k8sContext, k8sNamespace },
                },
            },
            input,
        } = ctx;
        await ctx.handleAuth();

        this.logger.infoBlank();
        this.logger.info(
            `Launching K9s in context '${k8sContext}', namespace '${k8sNamespace}'`
        );
        const k9sCommand = `k9s --context "${k8sContext}" --namespace "${k8sNamespace}" -c deployments`;

        if (input.flags.dryrun) this.logger.info(k9sCommand);
        else await runChiCommand(k9sCommand);
    }
};
