//@include "./../modules/Settings.js"
//@include "./../modules/SettingsDialog.js"
//@include "./../modules/env.js"
var baseDirName = 'cf-indesign';
var settingsFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_settings.json';
var isInternal = true;
var canvasflowDialog = new SettingsDialog(settingsFilePath, isInternal);
try {
    canvasflowDialog.show();
} catch(e) {
    alert(e.message);
}