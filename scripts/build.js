//@include "./../modules/CanvasflowSettings.js"
//@include "./../modules/CanvasflowBuild.js"

var os = 'unix';
if(/^Win(.)*/gm.test($.os)) {
    os = 'dos';
}

var baseDirName = 'cf-indesign';
var settingsFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_settings.json';
var resizeCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_resize.command';
var convertCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_convert.command';

var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
var cfBuild = new CanvasflowBuild(canvasflowSettings, resizeCommandFilePath, convertCommandFilePath, os);
try {
    cfBuild.build();
    alert('Complete build');
} catch(e) {
    alert(e.message);
}

