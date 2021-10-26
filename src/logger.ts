import pino from "pino";
import { prettyPrintYaml } from "./util";

export default class Logger {
    static root: Logger = new Logger("root");

    protected logger: pino.Logger;

    constructor(name: string, parent?: Logger) {
        const logLevel = process.env.KONFIG_LOG ?? "info";

        this.logger = name == "root"
            ? pino.final(pino({
                name: name,
                level: logLevel,
                transport: {
                    target: './pinoPretty.js',
                    options: {
                        level: logLevel,
                    }
                }
            }))
            : (parent || Logger.root).logger.child({
                name
            });
    }

    info(...args: string[]) {
        this.logger.info(args);
    }

    infoBlank() {
        Logger.root.info(' ');
    }

    debug(...args: string[]) {
        this.logger.debug(args);
    }

    debugBlank(...args: string[]) {
        Logger.root.debug(' ');
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
