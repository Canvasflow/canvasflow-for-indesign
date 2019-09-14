var CanvasflowSettings = function(settingsPath){
    var $ = this;
    $.settingsPath = settingsPath;
    $.defaultSavedSettings = '{"apiKey":"", "PublicationID": "", "IssueID": "", "StyleID": "", "endpoint": "", "previewImage": true, "pages": "", "creationMode": "document"}';

    $.getSavedSettings = function() {
        var file = new File($.settingsPath);
        if(file.exists) {
            file.open('r');
            return JSON.parse(file.read());
        }

        var file = new File($.settingsPath);
        file.encoding = 'UTF-8';
        file.open('w');
        file.write($.defaultSavedSettings);
        file.close();

        return $.defaultSavedSettings;
    };

    $.save = function(settings) {
        var file = new File($.settingsPath);
        file.encoding = 'UTF-8';
        file.open('w');
        var content = '{"apiKey":"' + settings.apiKey + 
        '", "PublicationID": "' + settings.PublicationID + 
        '", "IssueID":"' + settings.IssueID + 
        '", "StyleID": "' + settings.StyleID + 
        '", "endpoint": "' + settings.endpoint + 
        '", "previewImage": ' + settings.previewImage +
        ', "pages": "' + (settings.pages || '') + '"' + 
        ', "creationMode": "' + (settings.creationMode || 'document') + '"' +
        '}';
        file.write(content);
        file.close();
    }
}