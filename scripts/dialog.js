//@include "./../modules/CanvasflowSettings.js"
//@include "./../modules/CanvasflowDialog.js"
var baseDirName = 'cf-indesign';
var settingsFilePath = '~/' + baseDirName + '/canvasflow_settings.json';
var isInternal = false;
var canvasflowDialog = new CanvasflowDialog(settingsFilePath, isInternal);
try {
    canvasflowDialog.show();
} catch(e) {
    alert(e.message);
}