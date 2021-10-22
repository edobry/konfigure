import { Command } from "@oclif/command";
import { IConfig } from "@oclif/config";

import { Input, OutputArgs, OutputFlags } from "@oclif/parser";
import { CommandContext } from "./commandContext";
import { Flags, commonFlags, commonArgs } from "./flags";
import Logger from "./logger";

export { processDeployments } from "./common";
export { runCommand, runDtCommand } from "./shell";
export { CommandContext } from "./commandContext";

export interface CommandInput<T extends Flags> {
    flags: OutputFlags<T>;
    args: OutputArgs<any>;
    argv: string[];
};

export default abstract class BaseCommand<T extends Flags> extends Command {
    static flags = commonFlags;
    static args = commonArgs;

    private ctx?: CommandContext<T>;

    protected logger: Logger;

    constructor(argv: string[], config: IConfig) {
        super(argv, config);
        this.logger = new Logger(`${this.constructor.name}`);
    }

    get name() {
        return this.constructor.name;
    }

    async init(): Promise<void> {
        const input = this.parse(this.constructor as Input<T>);
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

    printMode<T extends Flags>({ flags: { dryrun, testing, auth, debug } }: CommandInput<T>, test: any) {
        this.logger.info(`running ${test.name}`);

        if(dryrun)
            this.logger.info("dryrun flag set: printing commands instead of executing")
        if(testing)
            this.logger.info("testing flag set: skipping repo updates")
        if(auth)
            this.logger.info("auth flag set: automatically authenticating")
        if(debug)
            this.logger.info("debug mode enabled")

    }
}
