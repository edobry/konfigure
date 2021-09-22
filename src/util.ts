import * as fs from "fs-extra";
import * as path from "path";
import * as yaml from "js-yaml";


import { TemplateTag, createTag, inlineArrayTransformer, splitStringTransformer, stripIndent, stripIndentTransformer, trimResultTransformer } from 'common-tags'
import { ValuesMap } from "./konfiguration";

export const pretty = new TemplateTag(
    stripIndentTransformer("initial"),
    trimResultTransformer(),
    splitStringTransformer('\n'),
    inlineArrayTransformer(),
);

type KonfigValue = string | number | object | boolean | undefined;
type ArgPrinter = (name: string, object: KonfigValue) => string;

export const printValue: ArgPrinter = (name: string, value: KonfigValue) => {
    if(typeof value === 'undefined')
        return '';

    let isObject = typeof value == 'object';

    if(isObject) {
    console.log(value)
        return Object.keys(value).length !== 0
            ? pretty`
                ${name}:
                    ${Object.entries(value)
                        .map(([key, val]) => {
                            // console.log("inner loop")
                            // console.log(key, val)
                            return printValue(key, val)
                        })

                        .join('\n')}`
            : '';
                    }
    return `${name}: ${value}`; 
}

// function printValue(val: KonfigValue): string {
//     if(typeof val === 'undefined')
//         return '';

//     if(typeof val === 'object')
//         return 
    
//     return val.toString()
// }

export function mapAndPrintArgs(mapper: ArgPrinter, ...args: [string, KonfigValue][]) {
    return args.map(x => mapper(...x))
        .filter(x => x.length >= 0)
        .join('\n')
}

function printArgsInternal(args: [string, KonfigValue][]) {
    return mapAndPrintArgs(printValue, ...args);
}
export function printArgs(args: { [index: string]: KonfigValue }) {
    return printArgsInternal(Object.entries(args));
}

export async function readOptionalFile(filePath: string): Promise<ValuesMap> {
    let fileContents;
    try {
        fileContents = await fs.readFile(filePath, { encoding: "UTF-8" });
    } catch(e) {
        // console.trace(`Could not read file ${filePath}!`);
        return {};
    }
    
    const extension = path.extname(filePath);

    switch(extension) {
        case ".json":
            return JSON.parse(fileContents);
        case ".yaml":
            return yaml.load(fileContents) as ValuesMap;
        default:
            throw new Error(
                `Invalid filepath '${filePath}' provided for values file; extension must be .yaml or .json!`);
    }
}
