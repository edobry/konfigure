import * as fs from "fs";
import * as path from "path";
import { Konfiguration } from "./konfiguration";

export function processInstances(instances: string[]) {
    if(instances[0] == "all") {
        console.log("processing all instances")
        if(instances.length > 1)
            console.warn("Additional instances specified after 'all' keyword, will be ignored.")
    } else
        console.log(`instances: ${instances.join(', ')}`);
}

export function readKonfig() {
    console.log("Reading konfiguration...");

    const currentDir = process.cwd();
    const envName = path.basename(currentDir);

    const konfigFile = fs.readFileSync(path.join(currentDir, "konfig.json"), "UTF-8");
    const konfig = JSON.parse(konfigFile);

    return new Konfiguration(envName, konfig);
}
