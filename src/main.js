var squiggle = require("squiggle-lang");
var through = require("through");
var chalk = require("chalk");

// Have some cool formatting so the output is easier to skim.
function h1(text) {
    var underline = text.replace(/./g, "=");
    var actual = chalk.bold.cyan(text + "\n" + underline);
    console.error(actual);
}

function h2(text) {
    var actual = chalk.bold.blue(text);
    console.error(actual);
}

// The actually important part of the plugin. This is where the pretty
// warning/error reporting happens. Oh, and it also returns the compiled code :P
function compile(file, data, callback) {
    // Always generate source maps.
    // Browserify strips them unless you specify --debug.
    var options = {
        embedSourceMaps: true,
        color: true
    };
    var result = squiggle.compile(data, file, options);
    if (result.parsed) {
        if (result.warnings.length > 0) {
            h1("Warnings for " + file);
            console.error();
            result.warnings.forEach(function(w) {
                h2("Line " + w.line + ": " + w.data);
                console.error(w.context + "\n");
            });
        }
        callback(null, result.code);
    } else {
        var o = result.result.oopsy;
        console.error("Error in file " + file + "\n");
        console.error(o.data + "\n");
        console.error(o.context + "\n");
        throw new Error("parse error at line " + o.line);
    }
}

// Fantastic boilerplate code to grab the streaming file data and process it.
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

function isSquiggle(file) {
    return /\.sqg$/.test(file);
}

// Only transform things with the right file extension. Yawn.
function process(file) {
    return isSquiggle(file) ? transform(file) : through();
}

module.exports = process;
