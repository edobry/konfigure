import { ChildProcess, ChildProcessByStdio, CommonOptions, spawn, SpawnOptions, SpawnOptionsWithoutStdio } from "child_process";
import internal = require("stream");
import { GlobalFileIO } from "./fileIo";
import Logger from "./logger";

// adapted from https://github.com/joshuatz/nodejs-child-process-testing/blob/main/persistent-shell.js

type Consumer<T> = (result: T) => void;
type ConsumerList<T> = Consumer<T>[];
type CommandResult = {
    exitcode: number;
    output: string;
};
export type Shell = {
    chunks: string[];
    childShell: ChildProcess | ChildProcessByStdio<internal.Writable, internal.Readable, internal.Readable>;
    close: () => Promise<CommandResult>;
}
export type ControllableShell = Shell & {
    onData: (listener: Consumer<string>) => number;
    onControl: (listener: Consumer<string>) => number;
    unsubData: (id: number) => void;
    unsubControl: (id: number) => void;
};
export type ShellCommand = (command: string, options?: { pipeInput: boolean }) => Promise<CommandResult>;

const TERMINATOR = "EOF";
const TERMINATOR_CHUNK = `${TERMINATOR}\n`;

const logger = new Logger("Shell");

export async function initControllableShell(options?: { command: string }): Promise<ControllableShell> {
    const shell = await initShell(options);

    let latestDataId = 0;
    let latestControlId = 0;
    const dataListeners: {
        [index: string]: Consumer<string>;
    } = {};
    const controlListeners: {
        [index: string]: Consumer<string>;
    } = {};

    const onData = (listener: Consumer<string>): number => {
        const id = ++latestDataId;
        dataListeners[id] = listener;
        return id;
    };
    const unsubData = (id: number) => {
        delete dataListeners[id];
    };
    const unsubControl = (id: number) => {
        delete controlListeners[id];
    };
    const onControl = (listener: Consumer<string>): number => {
        const id = ++latestControlId;
        controlListeners[id] = listener;
        return id;
    };

    shell.childShell.stdout?.on("data", (data) => {
        const chunk: string = data.toString();
        Object.values(dataListeners)
            .forEach(f => f(chunk));

        logger.trace(`data: ${chunk}`);
        logger.trace(`data length: ${chunk.length}`);
        logger.trace(`data end: ${chunk.codePointAt(chunk.length-1)}`);
    }).pipe(process.stdout);
    onData(x => shell.chunks.push(x));

    shell.childShell.stderr?.on("data", (data) => {
        const chunk: string = data.toString();
        Object.values(controlListeners)
            .forEach(f => f(chunk));

        logger.trace(`data: ${chunk}`);
        logger.trace(`data length: ${chunk.length}`);
        logger.trace(`data end: ${chunk.codePointAt(chunk.length-1)}`);
    });
    // onControl(x => shell.chunks.push(x));

    return {
        ...shell,
        onData,
        unsubData,
        unsubControl,
        onControl
    };
};

export async function initShell(options?: { command: string; inheritStdio?: boolean }): Promise<Shell> {
    // TODO: make configurable
    const shell = "bash"; //process.env.SHELL;
    if(!shell)
        throw new Error("$SHELL not defined!");

    const shellOptions: SpawnOptions = {
        stdio: options?.inheritStdio ? "inherit" : "pipe"
    };
    if(options?.command)
        shellOptions.shell = shell;

    logger.debug("launching child shell...");
    const childShell = spawn(options?.command || shell, [], shellOptions);

    const chunks: string[] = [];

    const exitListeners: ConsumerList<CommandResult> = [];
    const errorListeners: ConsumerList<CommandResult | Error> = [];

    childShell.on("close", (exitcode: number) => {
        logger.trace(`exit: ${exitcode}`);

        (exitcode == 0
            ? exitListeners
            : errorListeners
        ).forEach((f) =>
            f({ exitcode, output: chunks.join("") })
        );
    });

    childShell.on("error", (err) => {
        logger.trace(`exit: ${err.message}`);

        errorListeners.forEach((f) => f(err));
    });
    const shellClose = new Promise<CommandResult>((res, rej) => {
        exitListeners.push(res);
        errorListeners.push(rej);
    });

    return {
        chunks,
        childShell,
        close: () => {
            childShell.stdin?.end();
            return shellClose;
        }
    };
};

export type ShellCommandRunner = { runCommand: ShellCommand };
export type InteractiveShell = Shell & ShellCommandRunner;
export async function initInteractiveShell(): Promise<InteractiveShell> {
    const shell = await initControllableShell();

    return {
        ...shell,
        runCommand: runInteractiveCommand(shell)
    };
}

const runInteractiveCommand: (shell: ControllableShell) => ShellCommand = (shell: ControllableShell) => async (command: string, options?: { pipeInput: boolean }): Promise<CommandResult> => {
    let commandDataChunks: string[] = [];
    let commandControlChunks: string[] = [];

    const commandResult = new Promise<CommandResult>((res, rej) => {
        const dataId = shell.onData((chunk) => {
            logger.trace(`current data chunk: ${chunk}`);

            commandDataChunks.push(chunk);
        });

        const controlId = shell.onControl((chunk) => {
            logger.trace(`current control chunk: ${chunk}`);
            commandControlChunks.push(chunk);

            if(chunk.endsWith(TERMINATOR_CHUNK)) {
                logger.trace("is terminator chunk");
                const chunkList = commandControlChunks.join("")
                    .replace(`\n${TERMINATOR_CHUNK}`, "").split("\n");
                const exitcode = parseInt(chunkList[chunkList.length-1], 10);
                logger.trace(`exit code: ${exitcode}`);
                logger.trace(commandControlChunks.join(", "));

                shell.unsubData(dataId);
                shell.unsubControl(controlId);

                if(options?.pipeInput)
                    process.stdin.unpipe(shell.childShell.stdin!);

                res({ exitcode, output: commandDataChunks.join("") });
                commandDataChunks = [];
                commandControlChunks = [];

                return;
            }
        });
    });

    if(options?.pipeInput)
        process.stdin.pipe(shell.childShell.stdin!);


    [command, "echo $? >&2", `echo "${TERMINATOR}" >&2`].forEach(x =>
        shell.childShell.stdin?.write(`${x};\n`));

    return commandResult;
};

export async function runCommand(command: string) {
    const { close } = await initShell({
        command, inheritStdio: true
    });
    return close();
};

export async function initChiShell() {
    const shell = await initInteractiveShell();

    logger.debug("initializing chitin...");
    try {
        await shell.runCommand(`source ${await findChiInitScript()}`);
    } catch (e) {
        Logger.root.debug((e as any).toString());
    }

    return shell;
};

async function findChiInitScript(): Promise<string> {
    const configDir = process.env.XDG_CONFIG_HOME || `${process.env.HOME || "~/"}/.config`;
    const chiConfigFile = `${configDir}/chitin/config.json`;

    const chiConfig = await GlobalFileIO.readOptionalFile(chiConfigFile);
    logger.debugYaml(chiConfig);
    const projectDir = chiConfig.projectDir;

    return `${projectDir}/chitin/shell/init.sh`;
}

export async function runChiCommand(command: string) {
    return runCommand(
        `source ${await findChiInitScript()}; ${command};`);
};
