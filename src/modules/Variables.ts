let isInternal = true;
let baseDirName = 'cf-indesign';

let os = 'unix';
if(/^Win(.)*/gm.test($.os)) {
	os = 'dos';
}

let settingsFilePath = `${getBasePath()}/${baseDirName}/canvasflow_settings.json`;
let resizeCommandFilePath = `${getBasePath()}/${baseDirName}/canvasflow_resize.command`;
let convertCommandFilePath = `${getBasePath()}/${baseDirName}/canvasflow_convert.command`;

if(os === 'dos') {
	resizeCommandFilePath = `${getBasePath()}/${baseDirName}/canvasflow_resize.bat`;
	convertCommandFilePath = `${getBasePath()}/${baseDirName}/canvasflow_convert.bat`;
}

let defaultHost = 'api.canvasflow.io';
let logFilePath = `${getBasePath()}/${baseDirName}/canvasflow.log`;
let isDebugEnable = true;