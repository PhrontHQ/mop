
var URL = require("url2");

module.exports = rebase;
function rebase(relativeLocation, source, config) {
    if (relativeLocation === "") {
        return relativeLocation;
    }
    if (relativeLocation === "#") {
        return relativeLocation;
    }
    var parsed = URL.parse(relativeLocation);
    // to not rebase fully qualified urls, unless they are fully qualified file
    // urls
    if (parsed.protocol != null && parsed.protocol !== "file:") {
        return relativeLocation;
    }
    // do not rebase urls qualified from the root of the domain
    if (parsed.root) {
        return relativeLocation;
    }
    var location = URL.resolve(source.location, relativeLocation),
        target = config.files[location];

    if (!target) {
        return relativeLocation;
    }

    var isSourceCSS = source.relativeLocation.endsWith("css");

    if(isSourceCSS) {
        parsed.pathname = target.relativeLocation;
    } else {
        parsed.pathname = URL.relative(source.buildLocation, target.buildLocation);
    }

    // console.log("***** v1. parsed.pathname = ", parsed.pathname);
    // console.log("***** v2. parsed.pathname = ", target.relativeLocation);

    // console.log("***** v1. return ", URL.format({
    //     pathname: URL.relative(source.buildLocation, target.buildLocation),
    //     query: parsed.query,
    //     search: parsed.search
    // }));
    // console.log("***** v2. return ", URL.format({
    //     pathname: parsed.pathname,
    //     query: parsed.query,
    //     search: parsed.search
    // }));

    return URL.format({
        // pathname: URL.relative(source.buildLocation, target.buildLocation),
        pathname: parsed.pathname,
        query: parsed.query,
        search: parsed.search
    });
}

