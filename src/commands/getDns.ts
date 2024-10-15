import BaseCommand, { CommandContext, processDeployments, runChiCommand } from "../baseCommand";

export default class K9sCommand extends BaseCommand<typeof K9sCommand.flags> {
    static description = "query the provisioned DNS name for the given deployment";
    static strict = false;

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(ctx: CommandContext<typeof K9sCommand.flags>) {
        const { env: { konfig }, input } = ctx;

        const { environment: { awsAccount, k8sContext, k8sNamespace } } = konfig;
        await ctx.handleAuth();

        const instances = konfig.filterDeployments(input);

        if(instances.length == 0) {
            this.logger.info("No deployments configured, nothing to do. Exiting!");
            return;
        }

        for(let i in instances) {
            const instance = instances[i][0];

            this.logger.infoBlank();
            this.logger.info(`Querying DNS name for instance '${instance}' in '${k8sNamespace}:${k8sContext}...`);
            const dnsCommand = `awsEksServiceGetExternalDns ${awsAccount} $(awsEksGetContextClusterName ${k8sContext}) ${k8sNamespace} ${instance}`;

            if(input.flags.dryrun)
                this.logger.info(dnsCommand);
            else
                await runChiCommand(dnsCommand);
        }
    }
};
