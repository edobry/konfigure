module.exports = (opts) =>
    require("pino-pretty")({
        ...opts,
        levelFirst: false,
        crlf: true,
        colorize: false,
        // singleLine: true,
        hideObject: true,
        // messageKey: "msg",
        ignore: "time,level,pid,hostname",
        // messageFormat: "test"
        messageFormat: ({ 0: msg, module, time }, messageKey, levelLabel) => {
            // console.log(args);
            // return `${module ? `${module} - ` : ''}${msg}`;
            return msg;
        },
    });
