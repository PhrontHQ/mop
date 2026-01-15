var terser = require("terser");
var commands = {
    uglify: function (source) {
        try {
            return terser.minify_sync(source, { warnings: false }).code;
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
