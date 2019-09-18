//@include "./../modules/settings.js"
//@include "./../modules/dialog.js"
var baseDirName = 'cf-indesign';
var settingsFilePath = '~/' + baseDirName + '/canvasflow_settings.json';
var isInternal = true;
var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
var canvasflowDialog = new CanvasflowDialog(canvasflowSettings, isInternal);
canvasflowDialog.show();