var apiKeySetting = 1;
var isInternal = true;
var canvasflowSettingsKey = 'CanvasflowSettings';
var baseDirName = 'cf-indesign';

var os = 'unix';
if(/^Win(.)*/gm.test($.os)) {
    os = 'dos';
}

var settingsFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_settings.json';
var resizeCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_resize.command';
var convertCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_convert.command';

if(os === 'dos') {
    resizeCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_resize.bat';
    convertCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_convert.bat';
}

var defaultHost = 'api.canvasflow.io';
var logFilePath = getBasePath() + '/' + baseDirName + '/canvasflow.log';
var logger;
var isDebugEnable = true;