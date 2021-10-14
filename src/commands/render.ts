import Command from '@oclif/command'

import { commonArgs, commonFlags } from '../flags';
import { printMode } from '../util';
import { initEnv, processDeployments } from '../common';
import { Konfiguration } from '../konfiguration';

export default class Render extends Command {
    static description = "render instance manifests";
    static strict = false

    static flags = {
       ...commonFlags
    }
    
    static args = [
        ...commonArgs
    ];

    async run() {
        const input = this.parse(Render);

        printMode(input, this.constructor);

        const env = await initEnv(input);
        await processDeployments(input, env,
            chart => chart.render());

        await env.shell.close();
    }
}
