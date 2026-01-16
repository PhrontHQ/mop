var URL = require("url2");
var entries = require("object-foreach");

const ROOT_FILES = new Set([
        "index.html",
        "favicon.ico"
    ]);

// assigns a build location to each package and file
module.exports = relocate;
function relocate(appPackage, config) {
    if (appPackage === undefined) {
        throw new Error("Missing appPackage argument");
    }

    var packages = appPackage.packages,
        indexPath = appPackage.config.name + config.delimiter + appPackage.hash + "/",
        relativeUrlBase = appPackage.hash + "/";

    // app package
    appPackage.indexLocation = URL.resolve(
        config.buildLocation,
        indexPath
    );
    appPackage.buildLocation = URL.resolve(
        config.buildLocation,
        indexPath + relativeUrlBase
    );
    // all other packages
    entries(packages, function (pkg) {
        if (pkg.config.name !== appPackage.config.name) {
            pkg.buildLocation = URL.resolve(
                appPackage.buildLocation,
                "packages/" + pkg.config.name + config.delimiter + pkg.hash + "/",
            );
        }

        // files
        let isMainPackage = pkg.config.name === appPackage.config.name;
        entries(pkg.files, function (file, relativeLocation) {
            if (isMainPackage && ROOT_FILES.has(relativeLocation)) {
                file.buildLocation = URL.resolve(appPackage.indexLocation, relativeLocation);
                file.relativeUrlBase = relativeUrlBase;
            } else {
                file.buildLocation = URL.resolve(pkg.buildLocation, relativeLocation);
            }
            
        });
    });
}
