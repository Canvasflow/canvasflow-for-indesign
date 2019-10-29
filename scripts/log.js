//@include "./../modules/env.js"
//@include "./../modules/LogDialog.js"

var logFilePath = getBasePath() + '/cf-indesign/canvasflow.log';

/*var logger = new Logger(logFilePath, true);
logger.log((new Date()).getTime(), 'test func');
logger.log((new Date()).getTime(), 'test func2');
alert('Done')*/

var logDialog = new LogDialog(logFilePath);
logDialog.show();