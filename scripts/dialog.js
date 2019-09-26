//@include "./../modules/CanvasflowSettings.js"
//@include "./../modules/CanvasflowDialog.js"
var baseDirName = 'cf-indesign';
var settingsFilePath = '~/' + baseDirName + '/canvasflow_settings.json';
var isInternal = false;
var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
var canvasflowDialog = new CanvasflowDialog(canvasflowSettings, isInternal);
canvasflowDialog.show();