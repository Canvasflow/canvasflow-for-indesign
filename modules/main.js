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
            var canvasflowDialog = new CanvasflowDialog(settingsFilePath, isInternal);
            canvasflowDialog.show();
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
                canvasflowPublish.publish();
            } catch(e) {
                logError(e);
            }
        });

        var canvasflowScriptActionBuild = app.scriptMenuActions.add("&Build");  
        canvasflowScriptActionBuild.eventListeners.add("onInvoke", function() {  
            try {
                var settingsFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_settings.json';
                var resizeCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_resize.command';
                var convertCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_convert.command';
                
                var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
                var cfBuild = new CanvasflowBuild(canvasflowSettings, resizeCommandFilePath, convertCommandFilePath, os);
                var buildFile = new File(cfBuild.build());
                alert('Build Completed\n' + buildFile.displayName);
                buildFile.parent.execute()
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

logger = new CanvasflowLogger(logFilePath, isDebugEnable);
var canvasflowPlugin = new CanvasflowPlugin();
canvasflowPlugin.install();