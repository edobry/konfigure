import { ChildProcessByStdio, spawn } from "child_process";
import internal = require("stream");
import { readOptionalFile } from "./util";

// adapted from https://github.com/joshuatz/nodejs-child-process-testing/blob/main/persistent-shell.js

type ConsumerList<T> = ((result: T) => void)[];
type CommandResult = {
    exitcode: number,
    output: string,
};
export type Shell = {
    childShell: ChildProcessByStdio<internal.Writable, internal.Readable, internal.Readable>,
    runCommand: ShellCommand,
    close: () => Promise<string>
}
export type ShellCommand = (command: string, options?: { pipeInput: boolean }) => Promise<CommandResult>;

const TERMINATOR = "EOF";
const TERMINATOR_CHUNK = `${TERMINATOR}\n`;

export async function initShell(): Promise<Shell> {
    // TODO: make configurable
    const shell = "bash"; //process.env.SHELL;
    if(!shell)
        throw new Error("$SHELL not defined!");

    console.debug("launching child shell...")
    const childShell = spawn(shell, [], {
        stdio: "pipe"
    });

    const chunks: string[] = [];

    let latestId = 0;
    const dataListeners: {
        [index: string]: (id: string, chunk: string) => void,
    } = {};
    const controlListeners: {
        [index: string]: (id: string, chunk: string) => void,
    } = {};

    const exitListeners: ConsumerList<string> = [];
    const errorListeners: ConsumerList<string | Error> = [];

    childShell.stdout.on("data", (data) => {
        const chunk: string = data.toString();

        chunks.push(chunk);

        Object.entries(dataListeners).forEach(
            ([id, f]) => f(id, chunk));

        // console.log(`data: ${data}`)
        // console.log(`data length: ${data.length}`)
        // console.log(`data end: ${data.codePointAt(data.length-1)}`)
        // chunks.push(data);
        // dataListeners.forEach(f => f(data));
    }).pipe(process.stdout);

    childShell.stderr.on("data", (data) => {
        const chunk: string = data.toString();

        chunks.push(chunk);

        Object.entries(controlListeners).forEach(
            ([id, f]) => f(id, chunk));

        // console.log(`data: ${data}`)
        // console.log(`data length: ${data.length}`)
        // console.log(`data end: ${data.codePointAt(data.length-1)}`)
        // chunks.push(data);
        // dataListeners.forEach(f => f(data));
    })

    childShell.on("exit", (exitCode) => {
        // console.log(`exit: ${exitCode}`)

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

    const runCommand: ShellCommand = async (command: string, options?: { pipeInput: boolean }): Promise<CommandResult> => {
        let commandDataChunks: string[] = [];
        let commandControlChunks: string[] = [];

        const commandResult = new Promise<CommandResult>((res, rej) => {
            const id = ++latestId;
            dataListeners[id] = (id, chunk) => {
                // console.log(`current data chunk: ${chunk}`);

                commandDataChunks.push(chunk);
            };

            controlListeners[id] = (id, chunk) => {
                // console.log(`current control chunk: ${chunk}`);
                commandControlChunks.push(chunk);

                if (chunk.endsWith(TERMINATOR_CHUNK)) {
                    // console.log("is terminator chunk")
                    const exitcode = parseInt(
                        commandControlChunks.join('')
                            .replace(`\n${TERMINATOR_CHUNK}`, ''), 10);
                    // console.log(`exit code: ${exitcode}`);
                    // console.log(commandDataChunks);

                    delete dataListeners[id];
                    delete controlListeners[id];
                    if(options?.pipeInput)
                        process.stdin.unpipe(childShell.stdin);

                    res({ exitcode, output: commandDataChunks.join('') });
                    commandDataChunks = [];
                    commandControlChunks = [];

                    return;
                }
            };
        });

        if(options?.pipeInput) {
            process.stdin.setRawMode(true).pipe(childShell.stdin);
        }

        [command, "echo $? >&2", `echo "${TERMINATOR}" >&2`].forEach(x =>
            childShell.stdin?.write(`${x};\n`))

        return commandResult;
    };

    return {
        childShell,
        runCommand,
        close: () => {
            childShell.stdin.end();
            return shellClose;
        }
    };
};


export async function initDtShell() {
    const configDir = process.env.XDG_CONFIG_HOME || `${process.env.HOME || "~/"}/.config`;
    const dtConfigFile = `${configDir}/dataeng-tools/config.json`;

    const dtConfig = await readOptionalFile(dtConfigFile);
    // console.debug(prettyPrintYaml(dtConfig))
    const projectDir = dtConfig.projectDir;

    const shell = await initShell();
    
    console.debug("initializing dataeng-tools...")
    await shell.runCommand(`source ${projectDir}/dataeng-tools/shell/init.sh`);

    return shell;
};
