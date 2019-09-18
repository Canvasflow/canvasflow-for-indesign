var apiKeySetting = 1;
var isInternal = true;
var canvasflowSettingsKey = "CanvasflowSettings";
var baseDirName = 'cf-indesign';

var os = 'unix';
if(/^Win(.)*/gm.test($.os)) {
    os = 'dos';
}

var settingsFilePath = '~/' + baseDirName + '/canvasflow_settings.json';
var commandFilePath = '~/' + baseDirName + '/canvasflow_runner.command';
if(os === 'dos') {
    commandFilePath = '~/' + baseDirName + '/canvasflow_runner.bat';
}

var defaultHost = 'api.canvasflow.io';
var logFilePath = '~/' + baseDirName + '/canvasflow.log';
var logger;
var isDebugEnable = true;