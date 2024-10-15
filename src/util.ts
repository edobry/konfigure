import chalk from "chalk";
import highlight, { Theme } from "cli-highlight";

import {
    TemplateTag, inlineArrayTransformer, splitStringTransformer,
    stripIndentTransformer, trimResultTransformer
} from "common-tags";
import * as yaml from "js-yaml";

export const pretty = new TemplateTag(
    stripIndentTransformer("initial"),
    trimResultTransformer(),
    splitStringTransformer("\n"),
    inlineArrayTransformer(),
);

type KonfigValue = string | number | object | boolean | undefined;
type ArgPrinter = (name: string, object: KonfigValue) => string;

export const printValue: ArgPrinter = (name: string, value: KonfigValue) => {
    if(typeof value === "undefined")
        return "";

    let isObject = typeof value == "object";

    if(isObject) {
        console.log(value);
        return Object.keys(value).length !== 0
            ? pretty`
                ${name}:
                    ${Object.entries(value)
        .map(([key, val]) => {
            // console.log("inner loop")
            // console.log(key, val)
            return printValue(key, val);
        })

        .join("\n")}`
            : "";
    }
    return `${name}: ${value}`;
};

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
        .join("\n");
}

function printArgsInternal(args: [string, KonfigValue][]) {
    return mapAndPrintArgs(printValue, ...args);
}
export function printArgs(args: { [index: string]: KonfigValue }) {
    return printArgsInternal(Object.entries(args));
}

const offwhite = chalk.hex("#e0e2e4");
const green = chalk.hex("#93c763");
const orange = chalk.hex("#d39745");
const pumpkin = chalk.hex("#ec7600");
const teal = chalk.hex("#8cbbad");
const gray = chalk.hex("#818e96");

// adapted from https://github.com/highlightjs/highlight.js/blob/main/src/styles/obsidian.css
const obsidianTheme: Theme = {
    "default": offwhite,

    "keyword": green.bold,
    "selector-tag": green.bold,
    "literal": green.bold,
    "selector-id": green,

    "number": chalk.hex("#ffcd22"),

    "attribute": chalk.hex("#668bb0"),

    "regexp": orange,
    "link": orange,

    "meta": chalk.hex("#557182"),

    "tag": teal,
    "name": teal.bold,
    "bullet": teal,
    "subst": teal,
    "emphasis": teal,
    "type": teal.bold,
    "built_in": teal,
    "selector-attr": teal,
    "selector-pseudo": teal,
    "addition": teal,
    "variable": teal,
    "template-tag": teal,
    "template-variable": teal,

    "string": pumpkin,
    "symbol": pumpkin,

    "comment": gray,
    "quote": gray,
    "deletion": gray,

    "selector-class": chalk.hex("#A082BD"),

    "doctag": offwhite.bold,

    "code": chalk.white,
    "class": chalk.white,
    "title": chalk.white.bold,
    "section": chalk.white.bold
};

export function prettyPrintYaml(values: object): string {
    return highlight(yaml.dump(values), { language: "yaml", theme: obsidianTheme });
};
export function prettyPrintJson(values: object): string {
    return highlight(JSON.stringify(values, null, 4), { language: "json", theme: obsidianTheme });
};

export function fromEntries<V>(entries: [string, V][]) {
    return entries.reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
    }, {} as Record<string, V>);
};

export type UnpackAny<T> = T extends Promise<infer U> ? U: T;

export const deepSet = <T>(obj: Record<string, any>, values: object, ...fieldPath: string[]): void => {
    const [parent, field, ...restPath] = fieldPath;
    // console.log(`parent: ${parent}, field: ${field}, restPath: ${restPath}`);

    if(!obj[parent])
        obj[parent] = {};

    if(restPath.length > 0)
        return deepSet(obj[parent], values, field, ...restPath);

    obj[parent][field] = {
        ...obj[parent][field],
        ...values
    };
};
