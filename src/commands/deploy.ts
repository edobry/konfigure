import Command from '@oclif/command'

import { commonArgs, commonFlags } from '../flags';
import { printMode } from '../util';
import { initEnv, processDeployments } from '../common';

export default class Deploy extends Command {
    static description = "deploy instances to the current environment";
    static strict = false

    static flags = {
       ...commonFlags
    }
    
    static args = [
        ...commonArgs
    ];

    async run() {
        const input = this.parse(Deploy);

        printMode(input, this.constructor);

        const env = await initEnv(input);
        await processDeployments(input, env,
            chart => chart.deploy());

        await env.shell.close();
    }
}
