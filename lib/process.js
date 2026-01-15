var terser = require("terser");
var terserConfig = require("./minify-javascript-config");
var commands = {
    minify: function (source) {
        try {
            return terser.minify_sync(source, terserConfig).code;
        } catch (e) {
            throw e;
        }
    },
};

process.on("message", function (message) {
    try {
        process.send({
            id: message.id,
            result: commands[message.command](message.data),
        });
    } catch (e) {
        process.send({
            id: message.id,
            error: e,
        });
    }
});
