//@include "./../modules/settings.js"
//@include "./../modules/build.js"

var baseDirName = 'cf-indesign';
var settingsFilePath = '~/' + baseDirName + '/canvasflow_settings.json';
var commandFilePath = '~/' + baseDirName + '/canvasflow_runner.command';
var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
var cfBuild = new CanvasflowBuild(canvasflowSettings, commandFilePath);
try {
    cfBuild.build();
    alert('Complete build');
} catch(e) {
    alert(e.message);
}

