// import { Command, Config, Input, OutputArgs, OutputFlags } from "@oclif/core";
import { Command, Config, Interfaces } from "@oclif/core";
import { OutputArgs, OutputFlags } from "@oclif/core/lib/interfaces/parser";
import { CommandContext } from "./commandContext";
import { Flags, commonFlags, commonArgs } from "./flags";
import Logger from "./logger";

export { processDeployments } from "./common";
export { runCommand, runChiCommand } from "./shell";
export { CommandContext } from "./commandContext";

export type CommandFlags<T extends Flags> = {
    flags: OutputFlags<T>;
};

export interface CommandInput<T extends Flags> extends CommandFlags<T> {
    args: OutputArgs;
    argv: string[];
};

export default abstract class BaseCommand<T extends Flags> extends Command {
    static flags = commonFlags;
    static args = commonArgs;

    private ctx?: CommandContext<T>;

    protected logger: Logger;

    constructor(argv: string[], config: Config) {
        super(argv, config);
        this.logger = new Logger(`${this.constructor.name}`);
    }

    get name() {
        return this.constructor.name;
    }

    async init(): Promise<void> {
        const input = await this.parse(this.constructor as Interfaces.Input<T>) as CommandInput<T>;

        if(input.flags.debug)
            Logger.setGlobalLevel("debug");

        this.printMode(input, this.constructor);
        this.ctx = await CommandContext.init<T>(this.logger, input);
    }

    async run() {
        await this.command(this.ctx!);
    }

    abstract command(ctx: CommandContext<T>): Promise<void>

    async finally(_: Error | undefined) {
        await this.ctx?.env?.shell.close();
    }

    printMode({ flags: { dryrun, testing, auth, debug } }: CommandFlags<T>, test: any) {
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
