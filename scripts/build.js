//@include "./../modules/Settings.js"
//@include "./../modules/Build.js"

var os = 'unix';
if(/^Win(.)*/gm.test($.os)) {
    os = 'dos';
}

var baseDirName = 'cf-indesign';
var settingsFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_settings.json';
var resizeCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_resize.command';
var convertCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_convert.command';

var canvasflowSettings = new Settings(settingsFilePath);
var cfBuild = new Build(canvasflowSettings, resizeCommandFilePath, convertCommandFilePath, os);
try {
    alert('Complete build is located in the path: ' + cfBuild.build());
} catch(e) {
    alert(e.message);
}

