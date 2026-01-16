var MontageRequire = require("mod/core/mr/require");
var File = require("../file");
var minifyJavaScript = require("../minify-javascript");
var jshint = require("jshint").JSHINT;
var relativeToWorkingLocation = require("../util").relativeToWorkingLocation;

module.exports = transformJavaScript;
function transformJavaScript(file, config, callback) {
    file.utf8 = file.utf8.replace(/^#!/, "//#!");

    if (config.lint && file.package.isMainPackage() && !jshint(file.utf8)) {
        config.out.warn("jshint " + relativeToWorkingLocation(file.location));
    }

    var id = file.relativeLocation.replace(/\.js$/, "");
    var dependencies = MontageRequire.parseDependencies(file.utf8) || [];

    if (file.package.isMainPackage()) {
        if (id.toLowerCase() !== id) {
            config.out.warn("Module file name should be all lower-case " + relativeToWorkingLocation(file.location));
        }

        if (dependencies) {
            dependencies.forEach(function (dependency) {
                if (dependency.toLowerCase() !== dependency) {
                    config.out.warn(
                        "Module identifier " +
                            JSON.stringify(dependency) +
                            " should be lower-case in " +
                            relativeToWorkingLocation(file.location),
                    );
                }
            });
        }
 

    }

    function replaceExtension(fileName) {
        if (/\.js$/.test(fileName)) {
            return fileName.replace(/\.js$/, ".load.js")
        }
        return fileName + ".load.js";
    }

    var definedContent =
        "montageDefine(" +
        JSON.stringify(file.package.hash) +
        "," +
        JSON.stringify(id) +
        "," +
        "{" +
        "dependencies:" +
        JSON.stringify(dependencies) +
        "," +
        "factory:function(require,exports,module){" +
        file.utf8 +
        "\n}" +
        "}" +
        ")";
    var definedFile = new File({
        fs: config.fs,
        utf8: definedContent,
        path: file.path ? replaceExtension(file.path) : "",
        location: replaceExtension(file.location),
        relativeLocation: replaceExtension(file.relativeLocation),
        buildLocation: replaceExtension(file.buildLocation),
        package: file.package,
    });
    config.files[definedFile.location] = definedFile;
    file.package.files[definedFile.relativeLocation] = definedFile;

    if (config.minify) {
        minifyJavaScript.async(file.utf8, function (error, result) {
            if (error) {
                if (config.lint) {
                    config.out.warn("JavaScript parse error in " + file.path + ": " + error.message);
                }
                if (callback) {
                    callback();
                }
            } else {
                file.utf8 = result;
                definedFile.utf8 = "montageDefine(" +
                    JSON.stringify(file.package.hash) +
                    "," +
                    JSON.stringify(id) +
                    "," +
                    "{" +
                    "dependencies:" +
                    JSON.stringify(dependencies) +
                    "," +
                    "factory:function(require,exports,module){" +
                    file.utf8 +
                    "\n}" +
                    "}" +
                    ")";
                    if (callback) {
                        callback();
                    }
            }
        });
    } else {
        if (callback) {
            callback();
        }
    }
}
