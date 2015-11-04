var squiggle = require("squiggle-lang");
var through = require("through");

function isSquiggle(file) {
    return /\.sqg$/.test(file);
}

function compile(file, data, callback) {
    // TODO: Allow disabling source maps.
    var result = squiggle.compile(data, file, {embedSourceMaps: true});
    if (result.parsed) {
        // result has {parsed, warnings, sourceMap, code}
        // TODO: Get nicely formatted warnings with source code context
        result.warnings.forEach(function(w) {
            console.error([
                file + ":" + w.line + ":" + w.column,
                w.message
            ].join(" "));
        });
        callback(null, result.code);
    } else {
        // TODO: Handle parser errors gracefully
        throw new Error("parse error at index: " + result.result.index);
    }
}

function transform(file) {
    function write(buffer) {
        data += buffer;
    }
    function end() {
        compile(file, data, function(err, result) {
            if (err) {
                stream.emit("error", err);
            }
            stream.queue(result);
            stream.queue(null);
        })
    }
    var data = "";
    var stream = through(write, end);
    return stream;
}

function process(file) {
    if (!isSquiggle(file)) {
        return through();
    } else {
        return transform(file);
    }
}

module.exports = process;
