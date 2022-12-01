import pino from "pino";
import { prettyPrintJson, prettyPrintYaml } from "./util";

type Level = "fatal" | "error" | "warn" | "info" | "debug" | "trace";
type LevelWithSilent = Level | "silent";

export default class Logger {
    static loggers: Record<string, Logger> = {};

    static get root() {
        return Logger.loggers.root;
    }

    static setGlobalLevel(level: LevelWithSilent) {
        Object.entries(Logger.loggers).forEach(([, logger]) =>
            logger.setLevel(level)
        );
    }

    protected logger: pino.Logger;

    constructor(name: string, parent?: Logger) {
        const logLevel = process.env.KONFIG_LOG ?? "info";

        this.logger =
            name == "root"
                ? pino({
                      name: name,
                      level: logLevel,
                      ...(!process.env.JEST_WORKER_ID ? {
                        transport: {
                            target: "../lib/pinoPretty.js",
                            options: {
                                level: logLevel,
                            }
                        }
                    } : {}),
                  })
                : (parent || Logger.root).logger.child({ name });

        Logger.loggers[name] = this;
    }

    setLevel(level: LevelWithSilent) {
        this.logger.level = level;
    }

    info(...args: string[]) {
        this.logger.info(args);
    }

    infoBlank() {
        Logger.root.info(" ");
    }

    debug(...args: string[]) {
        this.logger.debug(args);
    }

    debugBlank(...args: string[]) {
        Logger.root.debug(" ");
    }

    debugYaml(object: any) {
        this.logger.debug([prettyPrintYaml(object)]);
    }

    debugJson(object: any) {
        this.logger.debug([prettyPrintJson(object)]);
    }

    trace(...args: string[]) {
        this.logger.trace(args);
    }

    warn(...args: string[]) {
        this.logger.warn(args);
    }

    error(...args: string[]) {
        this.logger.error(args);
    }

    fatal(...args: Error[]): never {
        this.logger.fatal(args[0].message);
        //TODO: ideally we wouldnt just throw here
        //TODO: but pino doesnt properly flush on exit
        throw args[0];
    }
};

new Logger("root");
