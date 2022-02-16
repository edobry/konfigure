import pino from "pino";
import { prettyPrintJson, prettyPrintYaml } from "./util";

type Level = "fatal" | "error" | "warn" | "info" | "debug" | "trace";
type LevelWithSilent = Level | "silent";

export default class Logger {
    static root: Logger = new Logger("root");

    protected logger: pino.Logger;

    constructor(name: string, parent?: Logger) {
        const logLevel = process.env.KONFIG_LOG ?? "info";

        this.logger = name == "root"
            ? pino({
                name: name,
                level: logLevel,
                transport: {
                    target: "../lib/pinoPretty.js",
                    options: {
                        level: logLevel,
                    },
                }})
            : (parent || Logger.root).logger.child({ name });
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
        this.logger.debug(prettyPrintYaml(object));
    }

    debugJson(object: any) {
        this.logger.debug(prettyPrintJson(object));
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
};
