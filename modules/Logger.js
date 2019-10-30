var Logger = function(logFilePath, os, version) {
    var $ = this;
    $.logFilePath = null;
    $.file = null;
    $.os = null;
    $.startTime = null;
    $.version = null;

    constructor = function(logFilePath, os, version) {
        $.logFilePath = logFilePath;
        $.file = new File(logFilePath);
        $.os = os;
        $.version = version;
        if(!$.file.exists) {
            $.file.encoding = 'UTF-8';
            $.file.open('w');
            $.file.writeln('---------- Canvasflow logs file ----------');
            $.file.close();
        }
    }

    constructor(logFilePath, os, version);

    pad = function(num) {
        var s = "000000000" + num;
        return s.substr(s.length-2);
    }

    $.start = function(action, document) {
        $.file = new File(logFilePath);
        $.file.open('a');
        $.file.writeln('\n---------- START ----------');
        var now = new Date();
        var currentDate = now.getFullYear()+'-'+pad((now.getMonth()+1))+'-'+pad(now.getDate());
        $.startTime = now;
        if(!!document) {
            $.file.writeln('Name: "' + document.filePath.displayName + '"');
            $.file.writeln('Path: "' + document.filePath.fsName + '"');
        }
        $.file.writeln('Date: "' + currentDate + '"');
        $.file.writeln('Action: "' + action + '"');
        $.file.writeln('OS: "' + $.os + '"');
        $.file.writeln('Version: "' + $.version + '"');
        $.file.writeln('Start time: "' + pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds()) + '"');
        $.file.writeln('---------------------------');
    }

    $.end = function(e) {
        if(!!e) {
            $.file.writeln('--------- ERROR ---------');
            $.file.writeln('Message: "' + e.message + '"');
            $.file.writeln('Line: ' + e.line);
            $.file.writeln('\nStack:\n' + e.getStack());
            $.file.writeln('\nJSON:\n' + e.toJson());
        }
        var now = new Date();
        $.endTime = now;
        $.file.writeln('---------------------------');
        $.file.writeln('End time: "' + pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds()) + '"');
        $.file.writeln('Total time: ' + Math.abs(($.endTime - $.startTime) / 1000) + ' seconds');
        $.file.writeln('---------- END ----------');
        $.file.close();
    }

    $.log = function(ms, name) {
        $.file.writeln(ms + ' - ' + name);
    }

    $.logError = function(e) {
        $.file.writeln('--------- ERROR ---------');
        $.file.writeln('Message: "' + e.message + '"');
        $.file.writeln('Line: ' + e.line);
        $.file.writeln('\nStack:\n' + e.getStack());
        $.file.writeln('\nJSON:\n' + e.toJson());
    }
}