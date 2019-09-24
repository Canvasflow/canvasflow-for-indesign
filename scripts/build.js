//@include "./../modules/CanvasflowSettings.js"
//@include "./../modules/CanvasflowBuild.js"

var baseDirName = 'cf-indesign';
var settingsFilePath = '~/' + baseDirName + '/canvasflow_CanvasflowSettings.json';
var commandFilePath = '~/' + baseDirName + '/canvasflow_runner.command';
var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
var cfBuild = new CanvasflowBuild(canvasflowSettings, commandFilePath);
try {
    cfBuild.build();
    alert('Complete build');
} catch(e) {
    alert(e.message);
}

