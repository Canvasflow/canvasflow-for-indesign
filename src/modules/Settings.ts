//@include "json2.js"
class Settings {
    private settingsPath: string;
    private defaultSavedSettings: string;
    constructor(settingsPath: string) {
        this.settingsPath = settingsPath;

        // @ts-ignore
        this.defaultSavedSettings = JSON.stringify({
            'apiKey': '',
            'PublicationID': '',
            'IssueID': '',
            'StyleID': '',
            'endpoint': '',
            'pages': '',
            'TemplateID': '-1',
            'creationMode': 'document',
            'contentOrder': 'natural'
        });
    }

    getSavedSettings(): any{
        var file = new File(this.settingsPath);
        if(file.exists) {
            file.open('r');
            // @ts-ignore
            return JSON.parse(file.read());
        }

        var file = new File(this.settingsPath);
        file.encoding = 'UTF-8';
        file.open('w');
        file.write(this.defaultSavedSettings);
        file.close();

        // @ts-ignore
        return JSON.parse(this.defaultSavedSettings);;
    };

    save(settings) {
        var file = new File(this.settingsPath);
        file.encoding = 'UTF-8';
        file.open('w');
        // @ts-ignore
        var content = JSON.stringify({
            'apiKey': settings.apiKey,
            'PublicationID': '' + settings.PublicationID,
            'IssueID': '' + settings.IssueID,
            'StyleID': '' + settings.StyleID,
            'TemplateID': '' + (settings.TemplateID || '-1'),
            'endpoint': settings.endpoint,
            'pages': (settings.pages || ''),
            'creationMode': (settings.creationMode || 'document'),
            'contentOrder': (settings.contentOrder || 'natural')
        });
        file.write(content);
        file.close();
    }
}