var rebase = require("../rebase");
var csso = require("csso");
var csstree = require("css-tree");
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
    if (config.noCss || !css || !css.trim()) {
        return css;
    }

    var ast, hasError = false;
    try {
        ast = csstree.parse(css, {
            parseValue: true,
            parseCustomProperty: true,
            onParseError: function (exception) {
                config.out.warn("CSS parse error: " + file.path);
                config.out.warn(exception && exception.message ? exception.message : String(exception));
                hasError = true;
            }
        });
    } catch (exception) {
        config.out.warn("CSS parse error: " + file.path);
        config.out.warn(exception && exception.message ? exception.message : String(exception));
        return css;
    }

    // Rebase url(...)
    try {
        csstree.walk(ast, {
            visit: "Url",
            enter: function (node) {
                var info = getUrlValue(node);
                if (!info) return;

                var rebased = rebase(info.url, file, config);
                setUrlValue(node, rebased, info.quote);
            }
        });
    } catch (error) {
        config.out.warn("CSS URL rebase error: " + file.path);
        config.out.warn(error && error.message ? error.message : String(error));
        return css;
    }

    return generateCss(ast, config);
}

transformCss.resolve = resolveCss;
function resolveCss(base, css, config) {
    var ast;
    try {
        ast = csstree.parse(css, {
            parseValue: true,
            parseCustomProperty: true
        });
    } catch (exception) {
        config.out.warn("CSS parse error prevented embedded CSS to be resolved: " + base);
        return css;
    }

    try {
        csstree.walk(ast, {
            visit: "Url",
            enter: function (node) {
                var info = getUrlValue(node);
                if (!info) return;

                // Preserve original behavior: only rewrite relative URLs
                if (info.url.indexOf(":") === -1) {
                    var url = info.url.replace(/"/g, '');
                        resolved = URL.resolve(base, url);
                    setUrlValue(node, resolved, info.quote);
                }
            }
        });
    } catch (error) {
        config.out.warn("CSS URL resolve error: " + base);
        config.out.warn(error && error.message ? error.message : String(error));
        return css;
    }

    return generateCss(ast, config);
}

/**
 * Generate CSS output.
 * Minify only when config.minifyCss === true.
 */
function generateCss(ast, config) {
    // 🔑 Conditional minification
    if (config && config.minifyCss) {
        try {
            var result = csso.minify(ast);
            if (result && typeof result.css === "string") {
                return result.css;
            }
        } catch (error) {
            config.out.warn("CSS minify error:");
            config.out.warn(error && error.message ? error.message : String(error));
        }
    }

    // Fallback / default: non-minified CSS
    try {
        return csstree.generate(ast);
    } catch (error) {
        return "";
    }
}

/**
 * Extract URL string + quote info from css-tree Url node
 */
function getUrlValue(node) {
    if (!node || node.type !== "Url") return null;

    if (node.value && typeof node.value === "object") {
        if (typeof node.value.value === "string") {
            return {
                url: node.value.value,
                quote: node.value.quote || ""
            };
        }
        return null;
    }

    if (typeof node.value === "string") {
        return { url: node.value, quote: "" };
    }

    return null;
}

/**
 * Set URL value back onto a css-tree Url node
 */
function setUrlValue(node, url, quote) {
    if (!node || node.type !== "Url") return;

    if (node.value && typeof node.value === "object") {
        node.value.value = url;
        if (quote) {
            node.value.quote = quote;
        }
        return;
    }

    node.value = url;
}
