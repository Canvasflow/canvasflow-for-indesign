//@include "json2.js"
Error.prototype.toJson = function() {
    if (typeof this.stack === "undefined" || this.stack === null) {
        this.stack = "placeholder";
        // The previous line is needed because the next line may indirectly call this method.
        this.stack = $.stack;
    }
    return JSON.stringify({
        line: this.line,
        message: this.message,
        stack: this.stack
    })
}

Error.prototype.toLog = function(logPath) {
    if (typeof this.stack === "undefined" || this.stack === null) {
        this.stack = "placeholder";
        // The previous line is needed because the next line may indirectly call this method.
        this.stack = $.stack;
    }

    var file = new File(logPath);
    file.encoding = 'UTF-8';
    file.open('w');
    file.writeln('line: ' + this.line);
    file.writeln('message: ' + this.message);
    file.writeln('stack: ' + this.stack);
    file.close();
}

function logError(e) {
    var file = new File("~/canvasflow_error_log.json");
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(e.toJson());
    file.close();
    e.toLog("~/canvasflow_error.log")
    alert(e.toJson())
}