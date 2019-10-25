//@include "./../modules/Logger.js"

var logFilePath = getBasePath() + '/canvaflow_debug_log.log';

var logger = new Logger(logFilePath, true);
logger.log((new Date()).getTime(), 'test func');
logger.log((new Date()).getTime(), 'test func2');
alert('Done')
