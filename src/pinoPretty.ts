module.exports = (opts: any) =>
    require("pino-pretty")({
        ...opts,
        levelFirst: true,
        crlf: true,
        colorize: false,
        // singleLine: true,
        hideObject: true,
        messageKey: "0",
        ignore: `time,level,pid,hostname${opts.level == "info" ? ",name" : ""}`,
        // messageFormat: "test"
        // messageFormat: ({ 0: msg, time }, messageKey, levelLabel) => {
        //     // console.log(args);
        //     return msg;
        //     // return `${opts.debug && module ? `${module} - ` : ''}${msg}`;
        //     // return msg;
        // },
    });
