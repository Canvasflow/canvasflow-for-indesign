var CanvasflowPlugin = function() {
    var $ = this;

    $.install = function() {
        try {
            app.menus.item("$ID/Main").submenus.item("Canvasflow").remove();
        } catch(e) {
    
        }
    
        var canvasflowScriptActionSettings = app.scriptMenuActions.add("Settings");  
        canvasflowScriptActionSettings.eventListeners.add("onInvoke", function() {  
            var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
            var canvasflowDialog = new CanvasflowDialog(canvasflowSettings, isInternal);
            canvasflowDialog.show();
        }); 
        
        var canvasflowScriptActionPublish = app.scriptMenuActions.add("Publish");  
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
                var canvasflowBuild = new CanvasflowBuild(canvasflowSettings, commandFilePath, os);
                var canvasflowApi = new CanvasflowApi('http://' + settings.endpoint + '/v2');
                var canvasflowPublish = new CanvasflowPublish(canvasflowSettings, settings.endpoint, canvasflowBuild, canvasflowApi);
                canvasflowPublish.publish();
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
    
        canvasflowScriptMenu.menuItems.add(canvasflowScriptActionSettings);
        canvasflowScriptMenu.menuItems.add(canvasflowScriptActionPublish);
    }
}

logger = new CanvasflowLogger(logFilePath, isDebugEnable);
var canvasflowPlugin = new CanvasflowPlugin();
canvasflowPlugin.install();