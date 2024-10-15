import * as path from "path";
import * as fs from "fs-extra";
import * as yaml from "js-yaml";

import { ValuesMap } from "./konfiguration";
import Logger from "./logger";

export interface IFileIO {
    readOptionalFile(filePath: string): Promise<ValuesMap>;
    readFile(filePath: string): Promise<ValuesMap>;
}

export class FileIO implements IFileIO {
    constructor() {}

    async readOptionalFile(filePath: string): Promise<ValuesMap> {
        try {
            return await this.readFile(filePath);
        } catch (e) {
            return {};
        }
    }

    async readFile(filePath: string): Promise<ValuesMap> {
        const fileContents = await fs.readFile(filePath, { encoding: "UTF-8" });

        switch (path.extname(filePath)) {
            case ".json": {
                try {
                    return JSON.parse(fileContents);
                } catch (e) {
                    Logger.root.error(`Unable to parse JSON file ${filePath}`);
                    throw e;
                }
            }
            case ".yaml":
                return yaml.load(fileContents) as ValuesMap;
            default:
                throw new Error(
                    `Invalid filepath '${filePath}' provided for values file; extension must be .yaml or .json!`
                );
        }
    }
}

export const GlobalFileIO = new FileIO();
