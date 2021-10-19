import { Command } from '@oclif/command'
import { Input, OutputArgs, OutputFlags } from '@oclif/parser'
import { Flags } from "./flags";

import { commonFlags, commonArgs } from './flags';

export interface CommandInput<T extends Flags> {
    flags: OutputFlags<T>;
    args: OutputArgs<any>;
    argv: string[];
};

export default abstract class BaseCommand extends Command {
    static flags = commonFlags;
    static args = commonArgs;

    protected input?: CommandInput<typeof BaseCommand.flags>;

    async init(): Promise<void> {
        this.input = this.parse(this.constructor as Input<typeof BaseCommand.flags>);
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
