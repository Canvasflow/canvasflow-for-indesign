//@include "./../modules/CanvasflowSettings.js"
//@include "./../modules/CanvasflowDialog.js"
var baseDirName = 'cf-indesign';
var settingsFilePath = '~/' + baseDirName + '/canvasflow_CanvasflowSettings.json';
var isInternal = true;
var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
var canvasflowDialog = new CanvasflowDialog(canvasflowSettings, isInternal);
canvasflowDialog.show();