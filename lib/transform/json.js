var File = require("../file");
var minifyJavaScript = require("../minify-javascript");
var relativeToWorkingLocation = require("../util").relativeToWorkingLocation;

module.exports = transformJson;
function transformJson(file, config, callback) {
    if (config.minify) {
        // minify original json
        try {
            file.utf8 = JSON.stringify(JSON.parse(file.utf8));
        } catch (exception) {
            if (exception instanceof SyntaxError) {
                config.out.warn(
                    "JSON parse error in " + relativeToWorkingLocation(file.location) + ": " + exception.message,
                );
            } else {
                throw exception;
            }
        }
    }
    var parsed = "";
    if (file.utf8) {
        try {
            parsed = JSON.parse(file.utf8);
        } catch (e) {
            console.error(`Failed to parse json file at ${file.location} due to error`);
            console.error(e);
        }
    } else {
        parsed = "";
    }

    //FIXME - This accounts for the quotation marks on the JSON properties/values themselves, but it fails
    // when there is an escaped quotation mark within a property value
    // e.g. {"description": "This is an example where you have an \"escaped question mark\" in a value"}
    parsed = JSON.stringify(parsed).replace(/"/g, '\\"').replace(/\\n/g, '\\\\n');

    var definedContent =
        "montageDefine(" +
        JSON.stringify(file.package.hash) +
        "," +
        JSON.stringify(file.relativeLocation) +
        "," +
        (file.location.endsWith(".mjson")
            ? '{text:"' + parsed + '"}'
            : "{exports: " + file.utf8 + "}") +
        ")";

    
    var definedFile = new File({
        fs: config.fs,
        utf8: definedContent,
        path: file.path + ".load.js",
        location: file.location + ".load.js",
        relativeLocation: file.relativeLocation + ".load.js",
        buildLocation: file.buildLocation + ".load.js",
        package: file.package,
    });
    config.files[definedFile.location] = definedFile;
    file.package.files[definedFile.relativeLocation] = definedFile;
    if (config.minify) {
        // minify created json.load.js
        try {
            definedFile.utf8 = minifyJavaScript(definedFile.utf8, definedFile.path);
        } catch (exception) {
            config.out.warn("JSON parse error in " + definedFile.path + ": " + exception.message);
        }
    }
    if (callback) {
        callback();
    }
}
