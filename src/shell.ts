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
    childShell: ChildProcessByStdio<internal.Writable, internal.Readable, null>,
    runCommand: ShellCommand,
    close: () => Promise<string>
}
export type ShellCommand = (command: string) => Promise<CommandResult>;

const TERMINATOR = "EOF";
const TERMINATOR_CHUNK = `${TERMINATOR}\n`;

export async function initShell(): Promise<Shell> {
    const shell = process.env.SHELL;
    if(!shell)
        throw new Error("$SHELL not defined!");

    console.debug("launching child shell...")
    const childShell = spawn(shell, { stdio: ["pipe", "pipe", "inherit"] });

    const chunks: string[] = [];

    let latestId = 0;
    const dataListeners: {
        [index: string]: (id: string, chunk: string) => void,
    } = {};

    const exitListeners: ConsumerList<string> = [];
    const errorListeners: ConsumerList<string | Error> = [];

    childShell.stdout.on("data", (data) => {
        const chunk: string = data.toString();

        chunks.push(chunk);
        // commandChunks.push(chunk);

        Object.entries(dataListeners).forEach(([id, f]) => f(id, chunk));

        // console.log(`data: ${data}`)
        // console.log(`data length: ${data.length}`)
        // console.log(`data end: ${data.codePointAt(data.length-1)}`)
        // chunks.push(data);
        // dataListeners.forEach(f => f(data));
    }).pipe(process.stdout);

    childShell.on("exit", (exitCode) => {
        // console.log(`exit: ${exitCode}`)

        (exitCode == 0 ? exitListeners : errorListeners).forEach((f) =>
            f(chunks.join(""))
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

    const runCommand: ShellCommand = async (command: string): Promise<CommandResult> => {
        let commandChunks: string[] = [];

        const commandResult = new Promise<CommandResult>((res, rej) => {
            dataListeners[++latestId] = (id, chunk) => {
                // console.log(`current chunk: ${chunk}`);
                
                if (chunk.endsWith(TERMINATOR_CHUNK)) {
                    const exitcode = parseInt(chunk.replace(`\n${TERMINATOR_CHUNK}`, ""), 10);
                    // console.log(exitcode);
                    // console.log(commandChunks);

                    delete dataListeners[id];
                    res({ exitcode, output: commandChunks.join("") });
                    commandChunks = [];

                    return;
                }

                commandChunks.push(chunk);
            };
        });

        [command, "echo $?", `echo "${TERMINATOR}"`].forEach(x =>
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
