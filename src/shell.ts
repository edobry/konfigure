import { ChildProcessByStdio, spawn } from "child_process";
import internal = require("stream");
import { readOptionalFile } from "./util";

// adapted from https://github.com/joshuatz/nodejs-child-process-testing/blob/main/persistent-shell.js

type Consumer<T> = (result: T) => void;
type ConsumerList<T> = Consumer<T>[];
type CommandResult = {
    exitcode: number,
    output: string,
};
export type Shell = {
    childShell: ChildProcessByStdio<internal.Writable, internal.Readable, internal.Readable>,
    // runCommand: ShellCommand,
    close: () => Promise<string>,
    onData: (listener: Consumer<string>) => number
    onControl: (listener: Consumer<string>) => number
    unsubData: (id: number) => void,
    unsubControl: (id: number) => void
}
export type ShellCommand = (command: string, options?: { pipeInput: boolean }) => Promise<CommandResult>;

const TERMINATOR = "EOF";
const TERMINATOR_CHUNK = `${TERMINATOR}\n`;

export async function initShell(options?: { persist: boolean }): Promise<Shell> {
    // TODO: make configurable
    const shell = "bash"; //process.env.SHELL;
    if(!shell)
        throw new Error("$SHELL not defined!");

    console.debug("launching child shell...")
    const childShell = spawn(shell, [], {
        stdio: "pipe"
    });

    const chunks: string[] = [];

    let latestDataId = 0;
    let latestControlId = 0;
    const dataListeners: {
        [index: string]: Consumer<string>,
    } = {};
    const controlListeners: {
        [index: string]: Consumer<string>,
    } = {};

    const exitListeners: ConsumerList<string> = [];
    const errorListeners: ConsumerList<string | Error> = [];

    childShell.stdout.on("data", (data) => {
        const chunk: string = data.toString();

        chunks.push(chunk);

        Object.values(dataListeners).forEach(f => f(chunk));

        // console.log(`data: ${data}`)
        // console.log(`data length: ${data.length}`)
        // console.log(`data end: ${data.codePointAt(data.length-1)}`)
        // chunks.push(data);
        // dataListeners.forEach(f => f(data));
    }).pipe(process.stdout);

    childShell.stderr.on("data", (data) => {
        const chunk: string = data.toString();

        chunks.push(chunk);

        Object.values(controlListeners).forEach(f => f(chunk));

        // console.log(`data: ${data}`)
        // console.log(`data length: ${data.length}`)
        // console.log(`data end: ${data.codePointAt(data.length-1)}`)
        // chunks.push(data);
        // dataListeners.forEach(f => f(data));
    })

    childShell.on("close", (exitCode) => {
        // console.log(`exit: ${exitCode}`);

        (exitCode == 0
            ? exitListeners
            : errorListeners
        ).forEach((f) =>
            f(chunks.join(''))
        );
    });

    childShell.on("error", (err) => {
        // console.log(`exit: ${exitCode}`)

        errorListeners.forEach((f) => f(err));
    });
    const shellClose = new Promise<string>((res, rej) => {
        exitListeners.push(res);
        errorListeners.push(rej);
    });

    return {
        childShell,
        close: () => {
            childShell.stdin.end();
            return shellClose;
        },
        onData: (listener: Consumer<string>): number => {
            const id = ++latestDataId;
            dataListeners[id] = listener;
            return id;
        },
        unsubData: (id: number) => {
            delete dataListeners[id];
        },
        unsubControl: (id: number) => {
            delete controlListeners[id];
        },
        onControl: (listener: Consumer<string>): number => {
            const id = ++latestControlId;
            controlListeners[id] = listener;
            return id;
        }
    };
};

export type InteractiveShell = Shell & { runCommand: ShellCommand };
export async function initInteractiveShell(): Promise<InteractiveShell> {
    const shell = await initShell();
    
    return {
        runCommand: runInteractiveCommand(shell),
        ...shell
    };
}

const runInteractiveCommand: (shell: Shell) => ShellCommand = (shell: Shell) => async (command: string, options?: { pipeInput: boolean }): Promise<CommandResult> => {
    let commandDataChunks: string[] = [];
    let commandControlChunks: string[] = [];

    const commandResult = new Promise<CommandResult>((res, rej) => {
        const dataId = shell.onData((chunk) => {
            // console.debug(`current data chunk: ${chunk}`);

            commandDataChunks.push(chunk);
        });

        const controlId = shell.onControl((chunk) => {
            // console.debug(`current control chunk: ${chunk}`);
            commandControlChunks.push(chunk);

            if (chunk.endsWith(TERMINATOR_CHUNK)) {
                // console.debug("is terminator chunk")
                const exitcode = parseInt(
                    commandControlChunks.join('')
                        .replace(`\n${TERMINATOR_CHUNK}`, ''), 10);
                // console.log(`exit code: ${exitcode}`);
                // console.log(commandDataChunks);

                shell.unsubData(dataId);
                shell.unsubControl(controlId);

                if(options?.pipeInput)
                    process.stdin.unpipe(shell.childShell.stdin);

                res({ exitcode, output: commandDataChunks.join('') });
                commandDataChunks = [];
                commandControlChunks = [];

                return;
            }
        });
    });

    if(options?.pipeInput) {
        process.stdin.pipe(shell.childShell.stdin);
    }
    
    [command, "echo $? >&2", `echo "${TERMINATOR}" >&2`].forEach(x =>
        shell.childShell.stdin?.write(`${x};\n`));

    return commandResult;
};

export async function runCommand(command: string) {
    // TODO: make configurable
    const shell = "bash"; //process.env.SHELL;
    if(!shell)
        throw new Error("$SHELL not defined!");

    const childShell = spawn(command, [], {
        stdio: "inherit",
        shell
    });

    const chunks: string[] = [];

    let latestId = 0;
    const dataListeners: {
        [index: string]: (id: string, chunk: string) => void,
    } = {};

    const exitListeners: ConsumerList<CommandResult> = [];
    const errorListeners: ConsumerList<CommandResult | Error> = [];

    childShell.on("close", (code) => {
        // console.debug(`exit: ${code}`);

        const exitcode = code || 0;

        (exitcode == 0
            ? exitListeners
            : errorListeners
        ).forEach((f) =>
            f({ exitcode, output: chunks.join('') })
        );
    });

    childShell.on("error", (err) => {
        // console.log(`exit: ${exitCode}`)

        errorListeners.forEach((f) => f(err));
    });

    const shellClose = new Promise<CommandResult>((res, rej) => {
        exitListeners.push(res);
        errorListeners.push(rej);
    });

    return shellClose;
};

export async function initDtShell() {
    const shell = await initInteractiveShell();
    
    console.debug("initializing dataeng-tools...")
    await shell.runCommand(`source ${await findDtInitScript()}`);

    return shell;
};

async function findDtInitScript(): Promise<string> {
    const configDir = process.env.XDG_CONFIG_HOME || `${process.env.HOME || "~/"}/.config`;
    const dtConfigFile = `${configDir}/dataeng-tools/config.json`;

    const dtConfig = await readOptionalFile(dtConfigFile);
    // console.debug(prettyPrintYaml(dtConfig))
    const projectDir = dtConfig.projectDir;

    return `${projectDir}/dataeng-tools/shell/init.sh`;
}

export async function runDtCommand(command: string) {
    return runCommand(
        `source ${await findDtInitScript()}; ${command};`);
};
