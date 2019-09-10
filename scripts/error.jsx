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

try {
    throw new Error("Houston, we have a problem.");
}
catch (e) {
    logError(e)
}

function logError(e) {
    var file = new File("~/canvasflow_error_log.json");
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(e.toJson());
    file.close();
    alert(e.toJson())
}