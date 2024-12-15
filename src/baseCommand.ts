import { Command, Config } from "@oclif/core";
import { Input, OutputArgs, OutputFlags } from "@oclif/core/lib/interfaces/parser";
import { CommandContext } from "./commandContext";
import { Flags, Args, commonFlags, commonArgs } from "./flags";
import Logger from "./logger";

export { processDeployments } from "./common";
export { runCommand, runChiCommand } from "./shell";
export { CommandContext } from "./commandContext";

export type CommandFlags<F extends Flags> = {
    flags: OutputFlags<F>;
};

export interface CommandInput<F extends Flags, A extends Args> extends CommandFlags<F> {
    args: OutputArgs<A>;
    argv: string[];
};

export default abstract class BaseCommand<F extends Flags, A extends Args> extends Command {
    static flags = commonFlags;
    static args = commonArgs;

    private ctx?: CommandContext<F, A>;

    protected logger: Logger;

    constructor(argv: string[], config: Config) {
        super(argv, config);
        this.logger = new Logger(`${this.constructor.name}`);
    }

    get name() {
        return this.constructor.name;
    }

    async init(): Promise<void> {
        const input = await this.parse(this.constructor as Input<F, F, A>) as CommandInput<F, A>;

        if(input.flags.debug)
            Logger.setGlobalLevel("debug");

        this.printMode(input, this.constructor);
        this.ctx = await CommandContext.init<F, A>(this.logger, input);
    }

    async run() {
        await this.command(this.ctx!);
    }

    abstract command(ctx: CommandContext<F, A>): Promise<void>

    async finally(_: Error | undefined) {
        await this.ctx?.env?.shell.close();
    }

    printMode({ flags: { dryrun, testing, auth, debug } }: CommandFlags<F>, test: any) {
        this.logger.info(`running ${test.name}`);

        if(dryrun)
            this.logger.info("dryrun flag set: printing commands instead of executing");
        if(testing)
            this.logger.info("testing flag set: skipping repo updates");
        if(auth)
            this.logger.info("auth flag set: automatically authenticating");
        if(debug)
            this.logger.info("debug mode enabled");

    }
}
