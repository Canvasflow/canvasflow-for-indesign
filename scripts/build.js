//@include "./../modules/settings.js"
//@include "./../modules/build.js"

var settingsFilePath = "~/canvaflow_settings.json";
var commandFilePath = "~/canvasflow_runner.command";
var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
var cfBuild = new CanvasflowBuild(canvasflowSettings, commandFilePath);
cfBuild.build();
alert('Complete build');