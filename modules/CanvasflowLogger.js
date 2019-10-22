var CanvasflowLogger = function(logFilePath, enable) {
    var $ = this;
    $.logFilePath = logFilePath;
    $.enable = enable;

    $.createFile = function() {
        var file = new File($.logFilePath);
        if(file.exists) {
            file.open('r');
            file.remove();
        }

        if($.enable) {
            var file = new File($.logFilePath);
            file.encoding = 'UTF-8';
            file.open('w');
            file.write('');
            file.close();
        }
    }

    $.log = function(ms, name) {
        if($.enable) {
            var file = new File($.logFilePath);
            file.encoding = 'UTF-8';
            file.open('a');
            file.write(ms + ' - ' + name + '\n');
            file.close();
        }
    }

    $.createFile();
}
logger = new CanvasflowLogger(logFilePath, isDebugEnable);