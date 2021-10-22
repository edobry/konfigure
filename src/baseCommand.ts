import { Command } from "@oclif/command";
import { IConfig } from "@oclif/config";

import { Input, OutputArgs, OutputFlags } from "@oclif/parser";
import { Environment, initEnv } from "./common";
import { Flags, commonFlags, commonArgs } from "./flags";
import Logger from "./logger";

export { Environment, processDeployments } from "./common";
export { runCommand, runDtCommand } from "./shell";

export interface CommandInput<T extends Flags> {
    flags: OutputFlags<T>;
    args: OutputArgs<any>;
    argv: string[];
};

export default abstract class BaseCommand extends Command {
    static flags = commonFlags;
    static args = commonArgs;

    private input?: CommandInput<typeof BaseCommand.flags>;
    private env?: Environment;

    protected logger: Logger;

    constructor(argv: string[], config: IConfig) {
        super(argv, config);
        this.logger = new Logger("BaseCommand");
    }

    async init(): Promise<void> {
        this.input = this.parse(this.constructor as Input<typeof BaseCommand.flags>);
    }

    async run() {
        this.printMode(this.input!, this.constructor);
        this.env = await initEnv(this.input!);

        await this.command(this.env, this.input!);
    }

    abstract command(env: Environment, input: CommandInput<typeof BaseCommand.flags>): Promise<void>

    async finally(_: Error | undefined) {
        await this.env?.shell.close();
    }

    printMode<T extends Flags>({ flags: { dryrun, testing, auth, debug } }: CommandInput<T>, test: any) {
        if(dryrun)
            this.logger.info("-- DRYRUN MODE --")
        if(testing)
            this.logger.info("-- TESTING MODE --")
        if(auth)
            this.logger.info("-- AUTH MODE --")
        if(debug)
            this.logger.info("-- DEBUG MODE --")

        this.logger.info(`-- ${test.name.toUpperCase()} MODE --`);
    }
}
