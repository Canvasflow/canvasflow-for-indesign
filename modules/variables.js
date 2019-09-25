var apiKeySetting = 1;
var isInternal = true;
var canvasflowSettingsKey = "CanvasflowSettings";
var baseDirName = 'cf-indesign';

var os = 'unix';
if(/^Win(.)*/gm.test($.os)) {
    os = 'dos';
}

var settingsFilePath = '~/' + baseDirName + '/canvasflow_CanvasflowSettings.json';
var resizeCommandFilePath = '~/' + baseDirName + '/canvasflow_resize.command';
var convertCommandFilePath = '~/' + baseDirName + '/canvasflow_convert.command';

if(os === 'dos') {
    resizeCommandFilePath = '~/' + baseDirName + '/canvasflow_resize.bat';
    convertCommandFilePath = '~/' + baseDirName + '/canvasflow_convert.bat';
}

var defaultHost = 'api.canvasflow.io';
var logFilePath = '~/' + baseDirName + '/canvasflow.log';
var logger;
var isDebugEnable = true;