//@include "./../modules/CanvasflowSettings.js"
//@include "./../modules/CanvasflowDialog.js"
var baseDirName = 'cf-indesign';
var settingsFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_settings.json';
var isInternal = true;
var canvasflowDialog = new CanvasflowDialog(settingsFilePath, isInternal);
try {
    canvasflowDialog.show();
} catch(e) {
    alert(e.message);
}