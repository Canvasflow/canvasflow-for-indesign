var apiKeySetting = 1;
var isInternal = true;
var canvasflowSettingsKey = "CanvasflowSettings";

var os = 'unix';
if(/^Win(.)*/gm.test($.os)) {
    os = 'dos';
}

var settingsFilePath = "~/canvasflow_settings.json";
var commandFilePath = "~/canvasflow_runner.command";
if(os === 'dos') {
    commandFilePath = "~/canvasflow_runner.bat";
}

var defaultHost = 'api.canvasflow.io';
var logFilePath = "~/canvasflow_debug_log.log";
var logger;
var isDebugEnable = true;