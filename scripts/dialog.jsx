//@include "json2.js"
//@include "api.js"

var CanvasflowDialog = function(settingsPath, internal) {
    var $ = this;
    $.settingsPath = settingsPath;
    $.isInternal = internal;
    $.defaultSavedSettings = '{"apiKey":"", "PublicationID": "", "IssueID": "", "StyleID": "", "endpoint": "", "previewImage": true}';

    $.getSavedSettings = function() {
        var file = new File($.settingsPath);
        if(file.exists) {
            file.open('r');
            return JSON.parse(file.read());
        } else {
            var file = new File($.settingsPath);
            file.encoding = 'UTF-8';
            file.open('w');
            file.write($.defaultSavedSettings);
            file.close();

            $.getSavedSettings();
        }
    };

    $.savedSettings = $.getSavedSettings();

    $.getPublications = function(apiKey, canvasflowApi) {
        var reply = canvasflowApi.getPublications(apiKey);
        return JSON.parse(reply);
    };

    $.getIssues = function(apiKey, PublicationID, canvasflowApi) {
        var reply = canvasflowApi.getIssues(apiKey, PublicationID);
        return JSON.parse(reply);
    };

    $.getStyles = function(apiKey, PublicationID, canvasflowApi) {
        var reply = canvasflowApi.getStyles(apiKey, PublicationID);
        return JSON.parse(reply);
    };

    $.getItemIndexByID = function(items, id) {
        for(var i = 0; i< items.length; i++) {
            if(items[i].id == id) {
                return i;
            }
        }
        return null;
    }

    $.getItemByID = function(items, id) {
        for(var i = 0; i< items.length; i++) {
            if(items[i].id == id) {
                return items[i];
            }
        }
        return null;
    }

    $.mapItemsName = function(items) {
        var response = [];
        for(var i = 0; i< items.length; i++) {
            response.push(items[i].name);
        }
        return response;
    }

    $.resetFromEndpoint = function(endpoint) {
        var settings = {
            apiKey: '',
            previewImage: $.savedSettings.previewImage,
            PublicationID: '',
            IssueID: '',
            StyleID: '',
            endpoint: endpoint
        };

        $.save(settings);
    }

    $.resetFromApi = function(apiKey, canvasflowApi, endpoint) {
        var PublicationID = '';
        var IssueID = '';
        var StyleID = '';
        var previewImage = $.savedSettings.previewImage;

        var publications = $.getPublications(apiKey, canvasflowApi);
        
        var publication = publications[0];
        PublicationID = publication.id;
        if(publication.type === 'issue') {
            var issues = $.getIssues(apiKey, PublicationID, canvasflowApi);
            var issue = issues[0];
            IssueID = issue.id;
        }

        var styles = $.getStyles(apiKey, PublicationID, canvasflowApi);
        var style = styles[0];
        StyleID = style.id;

        var settings = {
            apiKey: apiKey,
            PublicationID: PublicationID,
            IssueID: IssueID,
            StyleID: StyleID,
            endpoint: endpoint,
            previewImage: previewImage
        };

        $.save(settings);
    }

    $.resetFromPublication = function(apiKey, PublicationID, canvasflowApi, endpoint) {
        var IssueID = '';
        var StyleID = '';
        var previewImage = $.savedSettings.previewImage;
    
        var publications = $.getPublications(apiKey, canvasflowApi);
        var publication = $.getItemByID(publications, PublicationID, canvasflowApi);
        
        if(publication.type === 'issue') {
            var issues = $.getIssues(apiKey, PublicationID, canvasflowApi);
            var issue = issues[0];
            IssueID = issue.id;
        }
    
        var styles = $.getStyles(apiKey, PublicationID, canvasflowApi);
        var style = styles[0];
        StyleID = style.id;

        var settings = {
            apiKey: apiKey,
            PublicationID: PublicationID,
            IssueID: IssueID,
            StyleID: StyleID,
            endpoint: endpoint,
            previewImage: previewImage
        };

        $.save(settings);
    }
    // this.getOkCallback = getOkCallback.bind(this);

    $.save = function(settings) {
        var file = new File($.settingsPath);
        file.encoding = 'UTF-8';
        file.open('w');
        var content = '{"apiKey":"' + settings.apiKey + '", "PublicationID": "' + settings.PublicationID + '", "IssueID":"' + settings.IssueID + '", "StyleID": "' + settings.StyleID + '", "endpoint": "' + settings.endpoint + '", "previewImage": ' + settings.previewImage +'}';
        file.write(content);
        file.close();
    }

    $.processPublic = function() {
        var savedSettings = $.savedSettings;
        if(!savedSettings) {
            savedSettings = JSON.parse($.defaultSavedSettings);
            $.savedSettings = savedSettings;
        }

        var endpoint = 'api.canvasflow.io';
        var canvasflowApi = new CanvasflowApi('http://' + endpoint + '/v2');

        var apiKeyExist = false;
        
        var settingsDialog = new Window('dialog', 'Settings');
        settingsDialog.orientation = 'column';
        settingsDialog.alignment = 'right';
        settingsDialog.preferredSize = [300,100];

        var valuesWidth = 200;
        var labelWidth = 150;

        var publications = [];
        var selectedPublication;
        var selectedEndpoint;
        var publicationType = '';

        var issues = [];
        var styles = [];

        // Add Preview Image selector
        var previewImageOptions = ['True', 'False'];
        settingsDialog.previewImageDropDownGroup = settingsDialog.add('group');
        settingsDialog.previewImageDropDownGroup.orientation = 'row';
        settingsDialog.previewImageDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Use Thumbnails');
        settingsDialog.previewImageDropDownGroup.dropDown = settingsDialog.previewImageDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:previewImageOptions});
        settingsDialog.previewImageDropDownGroup.dropDown.helpTip = 'The plugin will use ';
        if(savedSettings.previewImage === true ) {
            savedSettings.previewImage = true;
            $.savedSettings.previewImage = true;
            settingsDialog.previewImageDropDownGroup.dropDown.selection = 0;
        } else {
            savedSettings.previewImage = false;
            $.savedSettings.previewImage = false;
            settingsDialog.previewImageDropDownGroup.dropDown.selection = 1;
        }

        //Add Api Key
        settingsDialog.apiKeyGroup = settingsDialog.add('group');
        settingsDialog.apiKeyGroup.orientation = 'row';
        settingsDialog.apiKeyGroup.add('statictext', [0, 0, labelWidth, 20], "API Key");
        settingsDialog.apiKeyGroup.apiKey = settingsDialog.apiKeyGroup.add('edittext', [0, 0, valuesWidth, 20], $.savedSettings.apiKey);

        if(!!savedSettings.apiKey) {
            apiKeyExist = true

            //Add Publication list
            publications = $.getPublications(savedSettings.apiKey, canvasflowApi);
            settingsDialog.publicationDropDownGroup = settingsDialog.add('group');
            settingsDialog.publicationDropDownGroup.orientation = 'row';
            settingsDialog.publicationDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Publication");
            settingsDialog.publicationDropDownGroup.dropDown = settingsDialog.publicationDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(publications)});
            
            if(!!savedSettings.PublicationID) {
                selectedPublication = $.getItemByID(publications, savedSettings.PublicationID);
                settingsDialog.publicationDropDownGroup.dropDown.selection = $.getItemIndexByID(publications, savedSettings.PublicationID);
            } else {
                selectedPublication = publications[0];
                settingsDialog.publicationDropDownGroup.dropDown.selection = 0;
            }

            publicationType = selectedPublication.type;

            // Check if publication is an issue
            if(publicationType === 'issue') {
                issues = $.getIssues(savedSettings.apiKey, selectedPublication.id, canvasflowApi);
                settingsDialog.issueDropDownGroup = settingsDialog.add('group');
                settingsDialog.issueDropDownGroup.orientation = 'row';
                settingsDialog.issueDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Issue");
                settingsDialog.issueDropDownGroup.dropDown = settingsDialog.issueDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(issues)})

                if(!!savedSettings.IssueID) {
                    settingsDialog.issueDropDownGroup.dropDown.selection = $.getItemIndexByID(issues, savedSettings.IssueID)
                } else {
                    settingsDialog.issueDropDownGroup.dropDown.selection = 0;
                }
            }

            // Select styles
            styles = $.getStyles(savedSettings.apiKey, selectedPublication.id, canvasflowApi);
            settingsDialog.styleDropDownGroup = settingsDialog.add('group');
            settingsDialog.styleDropDownGroup.orientation = 'row';
            settingsDialog.styleDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Style");
            settingsDialog.styleDropDownGroup.dropDown = settingsDialog.styleDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(styles)})

            if(!!savedSettings.StyleID) {
                settingsDialog.styleDropDownGroup.dropDown.selection = $.getItemIndexByID(styles, savedSettings.StyleID)
            } else {
                settingsDialog.styleDropDownGroup.dropDown.selection = 0;
            }
        } else {
            apiKeyExist = false;
        }

        // Panel buttons
        settingsDialog.buttonsBarGroup = settingsDialog.add('group');
        settingsDialog.buttonsBarGroup.orientation = 'row';
        settingsDialog.buttonsBarGroup.alignChildren = 'bottom';    
        settingsDialog.buttonsBarGroup.cancelBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'Cancel');
        settingsDialog.buttonsBarGroup.saveBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'OK');
        
        settingsDialog.buttonsBarGroup.saveBtn.onClick = function() {
            if(settingsDialog.previewImageDropDownGroup.dropDown.selection.index === 0) {
                $.savedSettings.previewImage = true;
            } else {
                $.savedSettings.previewImage = false;
            }

            if(!apiKeyExist) {
                var reply = canvasflowApi.validate(settingsDialog.apiKeyGroup.apiKey.text);
                var response = JSON.parse(reply);
                if(response.isValid) {
                    $.resetFromApi(settingsDialog.apiKeyGroup.apiKey.text, canvasflowApi);
                    settingsDialog.destroy();
                } else {
                    alert(reply.replace(/(")/gi, ''));
                }
            } else {
                // The api key was already validated
                if(savedSettings.apiKey !== settingsDialog.apiKeyGroup.apiKey.text) {
                    var reply = canvasflowApi.validate(settingsDialog.apiKeyGroup.apiKey.text);
                    var response = JSON.parse(reply);
                    if(response.isValid) {
                        $.resetFromApi(settingsDialog.apiKeyGroup.apiKey.text, canvasflowApi);
                        settingsDialog.destroy();
                    } else {
                        alert(reply.replace(/(")/gi, ''));
                    }
                } else {
                    var PublicationID = publications[settingsDialog.publicationDropDownGroup.dropDown.selection.index].id;
                    if(savedSettings.PublicationID != PublicationID) {
                        $.resetFromPublication(savedSettings.apiKey, PublicationID, canvasflowApi);
                        settingsDialog.destroy();
                    } else {
                        var StyleID = '';
                        try {
                            StyleID = styles[settingsDialog.styleDropDownGroup.dropDown.selection.index].id;
                        } catch(e) {
                            StyleID = '';
                        }

                        var IssueID = '';
                        try {
                            IssueID = issues[settingsDialog.issueDropDownGroup.dropDown.selection.index].id;
                        } catch(e) {
                            IssueID = '';
                        }
                        
                        savedSettings.PublicationID = PublicationID;
                        savedSettings.StyleID = StyleID;
                        savedSettings.IssueID = IssueID;
                        savedSettings.endpoint = selectedEndpoint.id;

                        $.save(savedSettings);
                        settingsDialog.destroy();
                    }
                }
            } 
        }

        settingsDialog.buttonsBarGroup.cancelBtn.onClick = function() {
            settingsDialog.destroy();
        }
        settingsDialog.show();
    };

    $.processInternal = function() {
        var savedSettings = $.savedSettings;
        if(!savedSettings) {
            savedSettings = JSON.parse($.defaultSavedSettings);
            $.savedSettings = savedSettings;
        }

        var canvasflowApi;

        var apiKeyExist = false;
        var endpointExist = false;
        var settingsDialog = new Window('dialog', 'Settings');
        settingsDialog.orientation = 'column';
        settingsDialog.alignment = 'right';
        settingsDialog.preferredSize = [300,100];

        var valuesWidth = 200;
        var labelWidth = 150;

        var publications = [];
        var selectedPublication;
        var selectedEndpoint;
        var publicationType = '';

        var issues = [];
        var styles = [];

        // Add Preview Image selector
        var previewImageOptions = ['True', 'False'];
        settingsDialog.previewImageDropDownGroup = settingsDialog.add('group');
        settingsDialog.previewImageDropDownGroup.orientation = 'row';
        settingsDialog.previewImageDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Use preview images');
        settingsDialog.previewImageDropDownGroup.dropDown = settingsDialog.previewImageDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:previewImageOptions});
        if(savedSettings.previewImage === true ) {
            savedSettings.previewImage = true;
            $.savedSettings.previewImage = true;
            settingsDialog.previewImageDropDownGroup.dropDown.selection = 0;
        } else {
            savedSettings.previewImage = false;
            $.savedSettings.previewImage = false;
            settingsDialog.previewImageDropDownGroup.dropDown.selection = 1;
        }

        // Add endpoint selector
        var endpoints = [
            {
                name: 'Live',
                id: 'api.canvasflow.io'
            },
            {
                name: 'Cflowdev',
                id: 'api.cflowdev.com'
            }
        ];
        settingsDialog.endpointDropDownGroup = settingsDialog.add('group');
        settingsDialog.endpointDropDownGroup.orientation = 'row';
        settingsDialog.endpointDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Endpoint");
        settingsDialog.endpointDropDownGroup.dropDown = settingsDialog.endpointDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(endpoints)});  

        if(!!savedSettings.endpoint) {
            canvasflowApi = new CanvasflowApi('http://' + savedSettings.endpoint + '/v2');
            endpointExist = true;
            selectedEndpoint = $.getItemByID(endpoints, savedSettings.endpoint);
            settingsDialog.endpointDropDownGroup.dropDown.selection = $.getItemIndexByID(endpoints, savedSettings.endpoint);

            //Add Api Key
            settingsDialog.apiKeyGroup = settingsDialog.add('group');
            settingsDialog.apiKeyGroup.orientation = 'row';
            settingsDialog.apiKeyGroup.add('statictext', [0, 0, labelWidth, 20], "API Key");
            settingsDialog.apiKeyGroup.apiKey = settingsDialog.apiKeyGroup.add('edittext', [0, 0, valuesWidth, 20], $.savedSettings.apiKey);
            
            if(!!savedSettings.apiKey) {
                apiKeyExist = true

                //Add Publication list
                publications = $.getPublications(savedSettings.apiKey, canvasflowApi);
                settingsDialog.publicationDropDownGroup = settingsDialog.add('group');
                settingsDialog.publicationDropDownGroup.orientation = 'row';
                settingsDialog.publicationDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Publication");
                settingsDialog.publicationDropDownGroup.dropDown = settingsDialog.publicationDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(publications)});
                
                if(!!savedSettings.PublicationID) {
                    selectedPublication = $.getItemByID(publications, savedSettings.PublicationID);
                    settingsDialog.publicationDropDownGroup.dropDown.selection = $.getItemIndexByID(publications, savedSettings.PublicationID);
                } else {
                    selectedPublication = publications[0];
                    settingsDialog.publicationDropDownGroup.dropDown.selection = 0;
                }

                publicationType = selectedPublication.type;

                // Check if publication is an issue
                if(publicationType === 'issue') {
                    issues = $.getIssues(savedSettings.apiKey, selectedPublication.id, canvasflowApi);
                    settingsDialog.issueDropDownGroup = settingsDialog.add('group');
                    settingsDialog.issueDropDownGroup.orientation = 'row';
                    settingsDialog.issueDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Issue");
                    settingsDialog.issueDropDownGroup.dropDown = settingsDialog.issueDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(issues)})

                    if(!!savedSettings.IssueID) {
                        settingsDialog.issueDropDownGroup.dropDown.selection = $.getItemIndexByID(issues, savedSettings.IssueID)
                    } else {
                        settingsDialog.issueDropDownGroup.dropDown.selection = 0;
                    }
                }

                // Select styles
                styles = $.getStyles(savedSettings.apiKey, selectedPublication.id, canvasflowApi);
                settingsDialog.styleDropDownGroup = settingsDialog.add('group');
                settingsDialog.styleDropDownGroup.orientation = 'row';
                settingsDialog.styleDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Style");
                settingsDialog.styleDropDownGroup.dropDown = settingsDialog.styleDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(styles)})

                if(!!savedSettings.StyleID) {
                    settingsDialog.styleDropDownGroup.dropDown.selection = $.getItemIndexByID(styles, savedSettings.StyleID)
                } else {
                    settingsDialog.styleDropDownGroup.dropDown.selection = 0;
                }
            } else {
                apiKeyExist = false;
            }
        } else {
            selectedEndpoint = endpoints[0];
            settingsDialog.endpointDropDownGroup.dropDown.selection = 0;
        }

        // Panel buttons
        settingsDialog.buttonsBarGroup = settingsDialog.add('group');
        settingsDialog.buttonsBarGroup.orientation = 'row';
        settingsDialog.buttonsBarGroup.alignChildren = 'bottom';    
        settingsDialog.buttonsBarGroup.cancelBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'Cancel');
        settingsDialog.buttonsBarGroup.saveBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'OK');
        
        settingsDialog.buttonsBarGroup.saveBtn.onClick = function() {
            if(settingsDialog.previewImageDropDownGroup.dropDown.selection.index === 0) {
                $.savedSettings.previewImage = true;
            } else {
                $.savedSettings.previewImage = false;
            }

            if(!endpointExist) {
                $.resetFromEndpoint(endpoints[settingsDialog.endpointDropDownGroup.dropDown.selection.index].id);
                settingsDialog.destroy();
            } else {
                var endpoint = endpoints[settingsDialog.endpointDropDownGroup.dropDown.selection.index].id;
                if(savedSettings.endpoint !== endpoints[settingsDialog.endpointDropDownGroup.dropDown.selection.index].id) {
                    $.resetFromEndpoint(endpoints[settingsDialog.endpointDropDownGroup.dropDown.selection.index].id);
                    settingsDialog.destroy();
                    return;
                }

                canvasflowApi = new CanvasflowApi('http://' + endpoint + '/v2');

                if(!apiKeyExist) {
                    var reply = canvasflowApi.validate(settingsDialog.apiKeyGroup.apiKey.text);
                    var response = JSON.parse(reply);
                    alert(response.isValid);
                    if(response.isValid) {
                        $.resetFromApi(settingsDialog.apiKeyGroup.apiKey.text, canvasflowApi, endpoint);
                        settingsDialog.destroy();
                    } else {
                        alert(reply.replace(/(")/gi, ''));
                    }
                } else {
                    // The api key was already validated
                    if(savedSettings.apiKey !== settingsDialog.apiKeyGroup.apiKey.text) {
                        var reply = canvasflowApi.validate(settingsDialog.apiKeyGroup.apiKey.text);
                        var response = JSON.parse(reply);
                        if(response.isValid) {
                            $.resetFromApi(settingsDialog.apiKeyGroup.apiKey.text, canvasflowApi, endpoint);
                            settingsDialog.destroy();
                        } else {
                            alert(reply.replace(/(")/gi, ''));
                        }
                    } else {
                        var PublicationID = publications[settingsDialog.publicationDropDownGroup.dropDown.selection.index].id;
                        if(savedSettings.PublicationID != PublicationID) {
                            $.resetFromPublication(savedSettings.apiKey, PublicationID, canvasflowApi, endpoint);
                            settingsDialog.destroy();
                        } else {
                            var StyleID = '';
                            try {
                                StyleID = styles[settingsDialog.styleDropDownGroup.dropDown.selection.index].id;
                            } catch(e) {
                                StyleID = '';
                            }
    
                            var IssueID = '';
                            try {
                                IssueID = issues[settingsDialog.issueDropDownGroup.dropDown.selection.index].id;
                            } catch(e) {
                                IssueID = '';
                            }
                            
                            savedSettings.PublicationID = PublicationID;
                            savedSettings.StyleID = StyleID;
                            savedSettings.IssueID = IssueID;
                            savedSettings.endpoint = selectedEndpoint.id;
    
                            $.save(savedSettings);
                            settingsDialog.destroy();
                        }
                    }
                } 
            }
        }

        settingsDialog.buttonsBarGroup.cancelBtn.onClick = function() {
            settingsDialog.destroy();
        }
        settingsDialog.show();
    };

    $.show = function() {
        if(!!$.isInternal) {
            $.processInternal()
        } else {
            $.processPublic();
        }
    };
}
var settingsFilePath = "~/canvaflow_settings.json";

var dialog = new CanvasflowDialog(settingsFilePath, true);
dialog.show()

