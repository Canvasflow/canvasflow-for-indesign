var CanvasflowPlugin = function() {
    var $ = this;

    $.install = function() {
        try {
            app.menus.item("$ID/Main").submenus.item("Canvasflow").remove();
        } catch(e) {
    
        }
    
        var canvasflowScriptActionSettings = app.scriptMenuActions.add("&Settings");  
        canvasflowScriptActionSettings.eventListeners.add("onInvoke", function() {  
            var settingsFile = new File(settingsFilePath);
            if(!settingsFile.parent.exists) {
                alert('Please run the Install command, help please refer to the help documentation');
                return ;
            }
            logger.log((new Date()).getTime(), '-----------     START     -----------');
            var canvasflowDialog = new CanvasflowDialog(settingsFilePath, isInternal);
            canvasflowDialog.show();
            logger.log((new Date()).getTime(), '-----------     END     -----------');
        }); 
        
        var canvasflowScriptActionPublish = app.scriptMenuActions.add("&Publish");  
        canvasflowScriptActionPublish.eventListeners.add("onInvoke", function() {  
            var settingsFile = new File(settingsFilePath);
            if(!settingsFile.exists) {
                alert('Please open Settings first and register the api key');
                return ;
            }
            try {
                settingsFile.open('r');
                var settings = JSON.parse(settingsFile.read());

                if(!settings.endpoint) {
                    alert('Please select an endpoint')
                    return;
                }

                if(!settings.apiKey) {
                    alert('Please register the api key in Settings')
                    return;
                }

                if(!settings.PublicationID) {
                    alert('Please select a publication in Settings')
                    return;
                }

                

                var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
                var canvasflowBuild = new CanvasflowBuild(canvasflowSettings, resizeCommandFilePath, convertCommandFilePath, os);
                var canvasflowApi = new CanvasflowApi('http://' + settings.endpoint + '/v2');
                var canvasflowPublish = new CanvasflowPublish(canvasflowSettings, settings.endpoint, canvasflowBuild, canvasflowApi);
                logger.log((new Date()).getTime(), '-----------     START     -----------');
                canvasflowPublish.publish();
                logger.log((new Date()).getTime(), '-----------     END     -----------');
            } catch(e) {
                logError(e);
            }
        });

        var canvasflowScriptActionBuild = app.scriptMenuActions.add("&Build");  
        canvasflowScriptActionBuild.eventListeners.add("onInvoke", function() {  
            try {
                if (app.documents.length != 0){
                    var response = confirm('Do you wish to proceed? \nThis will generate the deliverable ZIP file, but will NOT publish to Canvasflow.  Please do this only if instructed by a member of the Canvasflow support team.')
                    if(response) {
                        var settingsFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_settings.json';
                        var resizeCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_resize.command';
                        var convertCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_convert.command';
                        
                        var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
                        var cfBuild = new CanvasflowBuild(canvasflowSettings, resizeCommandFilePath, convertCommandFilePath, os);
                        logger.log((new Date()).getTime(), '-----------     START     -----------');
                        var buildFile = new File(cfBuild.build());
                        alert('Build Completed\n' + buildFile.displayName);
                        buildFile.parent.execute()
                        logger.log((new Date()).getTime(), '-----------     END     -----------');
                    }
                } else {
                    alert ('Please select an article to build');
                }
            } catch(e) {
                logError(e);
            }
        });

        var canvasflowScriptActionAbout = app.scriptMenuActions.add("&About");  
        canvasflowScriptActionAbout.eventListeners.add("onInvoke", function() {  
            try {
                var canvasflowAbout = new CanvasflowAbout(version);
                canvasflowAbout.show();
            } catch(e) {
                logError(e);
            }
        });
    
        var canvasflowScriptMenu = null;
        try {  
            canvasflowScriptMenu = app.menus.item("$ID/Main").submenus.item("Canvasflow");  
            canvasflowScriptMenu.title;  
        } catch (e) {  
            canvasflowScriptMenu = app.menus.item("$ID/Main").submenus.add("Canvasflow");  
        }  
    
        canvasflowScriptMenu.menuItems.add(canvasflowScriptActionPublish);
        canvasflowScriptMenu.menuItems.add(canvasflowScriptActionSettings);
        canvasflowScriptMenu.menuSeparators.add(LocationOptions.AT_END);
        canvasflowScriptMenu.menuItems.add(canvasflowScriptActionBuild);
        canvasflowScriptMenu.menuSeparators.add(LocationOptions.AT_END);
        canvasflowScriptMenu.menuItems.add(canvasflowScriptActionAbout);
    }
}

var canvasflowPlugin = new CanvasflowPlugin();
canvasflowPlugin.install();