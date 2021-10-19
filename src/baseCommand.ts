import { Command } from '@oclif/command'
import { Input, OutputArgs, OutputFlags } from '@oclif/parser'
import { Environment, initEnv } from './common';
import { Flags, commonFlags, commonArgs } from "./flags";

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
            console.log("-- DRYRUN MODE --")
        if(testing)
            console.log("-- TESTING MODE --")
        if(auth)
            console.log("-- AUTH MODE --")
        if(debug)
            console.log("-- DEBUG MODE --")

        console.log(`-- ${test.name.toUpperCase()} MODE --`);
    }
}
