import pino from "pino";
import { prettyPrintYaml } from "./util";

export default class Logger {
    static root: Logger = new Logger("root");

    protected logger: pino.Logger;

    constructor(module: string) {
        this.logger = module == "root"
            ? pino({
                transport: {
                    target: './pinoPretty.js',
                }
            })
            : Logger.root.logger.child({
                module
            });
    }

    info(...args: string[]) {
        this.logger.info(args);
    }

    infoBlank() {
        this.info(' ');
    }

    debug(...args: string[]) {
        this.logger.debug(args);
    }

    debugYaml(object: any) {
        this.logger.debug(prettyPrintYaml(object));
    }

    trace(...args: string[]) {
        this.logger.trace(args);
    }

    error(...args: string[]) {
        this.logger.error(args);
    }
};
