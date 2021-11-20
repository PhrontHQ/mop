
var rebase = require("../rebase");
var CSSO = require("csso");
var URL = require("url2");

module.exports = transformCss;
function transformCss(file, config, callback) {
    file.utf8 = rebaseCss(file.utf8, file, config);
    if (callback) {
        callback();
    }
}

transformCss.rebase = rebaseCss;
function rebaseCss(css, file, config) {
    // Handle empty CSS files
    if (config.noCss || !css.trim()) {
        return css;
    }
    var ast;
    try {
        ast = CSSO.syntax.parse(css);
    } catch (exception) {
        config.out.warn("CSS parse error: " + file.path);
        config.out.warn(exception.message);
        return css;
    }

    // traverse AST and modify it
    CSSO.syntax.walk(ast, function(node) {
        if (node.type === 'Url') {
            var value = node.value, uri, quote;

            if (value.type === "Raw") {
                uri = value.value;
                quote = "";
            } else if (value.type === "String") {
                // remove quotes (first and last character)
                quote = value.value.substring(0,1);
                uri = value.value.substring(1, value.value.length - 1);

                // turn quoted URIs into unquoted as special characters are
                // escaped by rebase
                value.type = "Raw";
            } else {
                config.out.warn("Unknown Url type:", value.type);
                return;
            }

            value.value = quote+rebase(uri, file, config)+quote;

        }
    });


    // var worklist = [ast];
    // while (worklist.length) {
    //     var node = worklist.pop(), quote;
    //     if (node[0] === "uri") {
    //         var value = node[1], uri;
    //         if (value[0] === "raw") {
    //             uri = value[1];
    //             quote = "";
    //         } else if (value[0] === "string") {
    //             // remove quotes (first and last character)
    //             quote = value[1].substring(0,1);
    //             uri = value[1].substring(1, value[1].length - 1);

    //             // turn quoted URIs into unquoted as special characters are
    //             // escaped by rebase
    //             node[1] = value = ["raw"];
    //         } else {
    //             config.out.warn("Unknown URI type:", value);
    //             continue;
    //         }

    //         value[1] = quote+rebase(uri, file, config)+quote;
    //     }

    //     for (var i = node.length - 1; i >= 0; i--) {
    //         if (Array.isArray(node[i])) {
    //             worklist.push(node[i]);
    //         }
    //     }
    // }

    try {
        var compressedAst = CSSO.syntax.compress(ast).ast;
    } catch (error) {
        config.out.warn("CSS compression error: " + file.path);
        config.out.warn(error.message);
    }

    // try {
    //     ast = CSSO.cleanInfo(ast);
    // } catch (error) {
    //     config.out.warn("CSS clean info error: " + file.path);
    //     config.out.warn(error.message);
    // }

   // return CSSO.translate(ast);
    return CSSO.syntax.generate(compressedAst);
}

transformCss.resolve = resolveCss;
function resolveCss(base, css, config) {
    var worklist,
        quote,
        value,
        node,
        ast,
        uri,
        i;

    try {
        ast = CSSO.syntax.parse(css);
    } catch (exception) {
        config.out.warn("CSS parse error prevented embedded CSS to be resolved: " + base);
        return css;
    }
    if (ast) {
        worklist = [ast];
        while (worklist.length) {
            node = worklist.pop();
            if (node[0] === "uri") {
                value = node[1];
                if (value[0] === "raw") {
                    uri = value[1];
                    quote = "";
                } else if (value[0] === "string") {
                    // remove quotes (first and last character)
                    quote = value[1].substring(0, 1);
                    uri = value[1].substring(1, value[1].length - 1);

                    // turn quoted URIs into unquoted as special characters are
                    // escaped by rebase
                    node[1] = value = ["raw"];
                } else {
                    config.out.warn("Unknown URI type:", value);
                    continue;
                }
                if (uri.indexOf(":") === -1) {
                    value[1] = quote + URL.resolve(base, uri) + quote;
                }
            }
            for (i = node.length - 1; i >= 0; i--) {
                if (Array.isArray(node[i])) {
                    worklist.push(node[i]);
                }
            }
        }
    }
    try {
        var compressedAst = CSSO.syntax.compress(ast).ast;
    } catch (error) {
        config.out.warn("CSS compression error: ");
        config.out.warn(error.message);
    }
    // try {
    //     compressedAst = CSSO.cleanInfo(compressedAst);
    // } catch (error) {
    //     config.out.warn("CSS clean info error:");
    //     config.out.warn(error.message);
    // }
    //return CSSO.translate(compressedAst);
    return CSSO.syntax.generate(compressedAst);

}

