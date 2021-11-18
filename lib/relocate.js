
var URL = require("url2");

// assigns a build location to each package and file
module.exports = relocate;
function relocate(appPackage, config) {

    if (appPackage === undefined) {
        throw new Error('Missing appPackage argument');
    }

    var packages = appPackage.packages;

    // app package
    appPackage.indexLocation = URL.resolve(
        config.buildLocation,
        appPackage.config.name + config.delimiter + appPackage.hash + "/"
    );
    appPackage.buildLocation = URL.resolve(
        config.buildLocation,
        appPackage.config.name + config.delimiter + appPackage.hash + "/" + appPackage.hash + "/"
    );
    // all other packages
    Object.values(packages).forEach(pkg => {
        if (pkg.config.name !== appPackage.config.name) {
            pkg.buildLocation = URL.resolve(
                appPackage.buildLocation,
                "packages/" +
                    pkg.config.name +
                    config.delimiter +
                    pkg.hash + "/"
            );
        }

        // files
        Object.entries(pkg.files).forEach(([relativeLocation, file]) => {
            file.buildLocation = URL.resolve(pkg.buildLocation, relativeLocation);
        });
    });

}

