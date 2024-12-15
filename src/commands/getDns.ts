import BaseCommand, { CommandContext, runChiCommand } from "../baseCommand.ts";

export default class GetDnsCommand extends BaseCommand<
    typeof GetDnsCommand.flags,
    typeof GetDnsCommand.args
> {
    static description =
        "query the provisioned DNS name for the given deployment";
    static strict = false;

    static flags = BaseCommand.flags;
    static args = BaseCommand.args;

    async command(
        ctx: CommandContext<
            typeof GetDnsCommand.flags,
            typeof GetDnsCommand.args
        >
    ) {
        const {
            env: { konfig },
            input,
        } = ctx;

        const {
            environment: { awsAccount, k8sContext, k8sNamespace },
        } = konfig;
        await ctx.handleAuth();

        const instances = konfig.filterDeployments(input);

        if (instances.length == 0) {
            this.logger.info(
                "No deployments configured, nothing to do. Exiting!"
            );
            return;
        }

        for (let i in instances) {
            const instance = instances[i][0];

            this.logger.infoBlank();
            this.logger.info(
                `Querying DNS name for instance '${instance}' in '${k8sNamespace}:${k8sContext}...`
            );
            const dnsCommand = `awsEksServiceGetExternalDns ${awsAccount} $(awsEksGetContextClusterName ${k8sContext}) ${k8sNamespace} ${instance}`;

            if (input.flags.dryrun) this.logger.info(dnsCommand);
            else await runChiCommand(dnsCommand);
        }
    }
};
