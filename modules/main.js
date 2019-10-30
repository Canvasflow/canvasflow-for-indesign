var osName = $.os;
var CanvasflowPlugin = function() {
    var $ = this;

    $.install = function() {
        try {
            app.menus.item('$ID/Main').submenus.item('Canvasflow').remove();
        } catch(e) {
    
        }
    
        var canvasflowScriptActionSettings = app.scriptMenuActions.add('&Settings');  
        canvasflowScriptActionSettings.eventListeners.add('onInvoke', function() {  
            var settingsFile = new File(settingsFilePath);
            if(!settingsFile.parent.exists) {
                alert('Please run the Install command, help please refer to the help documentation');
                return ;
            }

            try {
                var logger = new Logger(logFilePath, osName, version);
                logger.start('Settings');
                var settingsDialog = new SettingsDialog(settingsFilePath, isInternal, logger);
                settingsDialog.show();
                logger.end();
            } catch(e) {
                logger.end(e);
                alert(e.message);
            }
        }); 
        
        var canvasflowScriptActionPublish = app.scriptMenuActions.add('&Publish');  
        canvasflowScriptActionPublish.eventListeners.add('onInvoke', function() {  
            var settingsFile = new File(settingsFilePath);
            if(!settingsFile.exists) {
                alert('Please open Settings first and register the api key');
                return ;
            }
            var logger = new Logger(logFilePath, osName, version);
            try {
                settingsFile.open('r');
                var settingsData = JSON.parse(settingsFile.read());

                if(!settingsData.endpoint) {
                    alert('Please select an endpoint')
                    return;
                }

                if(!settingsData.apiKey) {
                    alert('Please register the api key in Settings')
                    return;
                }

                if(!settingsData.PublicationID) {
                    alert('Please select a publication in Settings')
                    return;
                }

                if(!!app.activeDocument) {
                    
                    var settings = new Settings(settingsFilePath);
                    var builder = new Builder(settings, resizeCommandFilePath, convertCommandFilePath, os, logger);
                    var canvasflowApi = new CanvasflowApi('http://' + settingsData.endpoint + '/v2');
                    var publisher = new Publisher(settings, settingsData.endpoint, builder, canvasflowApi, logger);
                    
                    logger.start('Publish', app.activeDocument);
                    publisher.publish();
                    logger.end();
                } else {
                    alert ('Please select an article to Publish');
                }               
            } catch(e) {
                logger.end(e);
                alert(e.message);
            }
        });

        var canvasflowScriptActionBuild = app.scriptMenuActions.add('&Build');  
        canvasflowScriptActionBuild.eventListeners.add('onInvoke', function() {
            var logger = new Logger(logFilePath, osName, version);
            try {
                if (app.documents.length != 0){
                    var response = confirm('Do you wish to proceed? \nThis will generate the deliverable ZIP file, but will NOT publish to Canvasflow.\n\nPlease do this only if instructed by a member of the Canvasflow support team.')
                    if(response) {
                        var settings = new Settings(settingsFilePath);
                        var builder = new Builder(settings, resizeCommandFilePath, convertCommandFilePath, os, logger);
                        logger.start('Build', app.activeDocument);
                        var buildFile = new File(builder.build());
                        logger.end();

                        if(builder.isBuildSuccess) {
                            alert('Build Completed\n' + buildFile.displayName);
                            buildFile.parent.execute()
                        } else {
                            alert('Build cancelled');
                        }
                    }
                } else {
                    alert ('Please select an article to build');
                }
            } catch(e) {
                logger.end(e);
                alert(e.message);
            }
        });

        var canvasflowScriptActionAbout = app.scriptMenuActions.add('&About');  
        canvasflowScriptActionAbout.eventListeners.add('onInvoke', function() {  
            try {
                var aboutDialog = new AboutDialog(version);
                aboutDialog.show();
            } catch(e) {
                alert(e.message);
            }
        });

        var canvasflowScriptActionLogs = app.scriptMenuActions.add('&Logs');  
        canvasflowScriptActionLogs.eventListeners.add('onInvoke', function() {  
            try {
                var logFilePath = getBasePath() + '/cf-indesign/canvasflow.log';
                var logDialog = new LogDialog(logFilePath);
                logDialog.show();
            } catch(e) {
                alert(e.message);
            }
        });
    
        var canvasflowScriptMenu = null;
        try {  
            canvasflowScriptMenu = app.menus.item('$ID/Main').submenus.item('Canvasflow');  
            canvasflowScriptMenu.title;  
        } catch (e) {  
            canvasflowScriptMenu = app.menus.item('$ID/Main').submenus.add('Canvasflow');  
        }  
    
        canvasflowScriptMenu.menuItems.add(canvasflowScriptActionPublish);
        canvasflowScriptMenu.menuItems.add(canvasflowScriptActionSettings);
        canvasflowScriptMenu.menuSeparators.add(LocationOptions.AT_END);
        canvasflowScriptMenu.menuItems.add(canvasflowScriptActionBuild);
        canvasflowScriptMenu.menuSeparators.add(LocationOptions.AT_END);
        canvasflowScriptMenu.menuItems.add(canvasflowScriptActionLogs);
        canvasflowScriptMenu.menuItems.add(canvasflowScriptActionAbout);
    }
}

var canvasflowPlugin = new CanvasflowPlugin($.os);
canvasflowPlugin.install();