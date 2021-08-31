// import * as fs from "fs";
// import * as path from "path";

// import * as merge from "deepmerge";
// import * as yaml from "js-yaml";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const processArgs = () =>
    yargs(hideBin(process.argv))
        .command({
            command: `deploy`,
            describe: "deploy instances to the current environment",
            handler: deployCommand
        })
        .command({
            command: `render`,
            describe: "render instance manifests",
            handler: renderCommand
        })
        .command({
            command: `debugPod`,
            describe: "launch a debugPod in the current environment",
            handler: debugPodCommand
        })
        .command({
            command: `k9s`,
            describe: "launch k9s in the current environment",
            handler: k9sCommand
        })
        .options({
            dryrun: {
                type: "boolean"
            },
            testing: {
                type: "boolean"
            },
            auth: {
                type: "boolean"
            },
            debug: {
                type: "boolean"
            }
        })
        .demandCommand(1).parse();

type argsType = ReturnType<typeof processArgs>;

const deployCommand = (props: argsType) => {
    console.log("deploy command received args:");
    console.log(props);

    processInstances(props._)
};

const processInstances = (positional: string[]) => {
    const instances = positional.slice(1);

    if(instances[0] == "all") {
        console.log("processing all instances")
        if(instances.length > 1)
            console.log("WARN: Additional instances specified after 'all' keyword, will be ignored.")
    } else
        console.log(`instances: ${instances.join(', ')}`);

}

const renderCommand = (props: any) => {
    console.log("render command received args:");
    console.log(props);
};

const debugPodCommand = (props: any) => {
    console.log("debugPod command received args:");
    console.log(props);
};

const k9sCommand = (props: any) => {
    console.log("k9s command received args:");
    console.log(props);
};

processArgs();
