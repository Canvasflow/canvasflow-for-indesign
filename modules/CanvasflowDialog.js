//@include "json2.js"
//@include "api.js"
//@include "CanvasflowSettings.js"

var CanvasflowDialog = function(canvasflowSettingsPath, internal) {
    var $ = this;
    $.canvasflowSettingsPath = canvasflowSettingsPath;
    $.canvasflowSettings = new CanvasflowSettings(canvasflowSettingsPath);
    $.isInternal = internal;
    $.canvasflowApi;
    settingsFilePath
    
    $.savedSettings = $.canvasflowSettings.getSavedSettings();

    $.validateKey = function(settingsDialog, endpoint) {
        var reply = $.canvasflowApi.validate(settingsDialog.apiKeyGroup.apiKey.text);
        var response = JSON.parse(reply);
        if(response.isValid) {
            $.reset(endpoint, settingsDialog.apiKeyGroup.apiKey.text)
            settingsDialog.close();
            $.show();
        } else {
            throw new Error(reply.replace(/(")/gi, ''))
        }
    }

    $.getPublications = function(apiKey) {
        var reply = $.canvasflowApi.getPublications(apiKey);
        return JSON.parse(reply);
    };

    $.getIssues = function(apiKey, PublicationID) {
        var reply = $.canvasflowApi.getIssues(apiKey, PublicationID);
        return JSON.parse(reply);
    };

    $.getStyles = function(apiKey, PublicationID) {
        var reply = $.canvasflowApi.getStyles(apiKey, PublicationID);
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

    $.reset = function(endpoint, apiKey, PublicationID) {
        var settings = {
            apiKey: apiKey || '',
            previewImage: $.savedSettings.previewImage || false,
            PublicationID: PublicationID || '',
            IssueID: '',
            StyleID: '',
            endpoint: endpoint,
            pages: $.savedSettings.pages || '',
            creationMode: $.savedSettings.creationMode || 'document'
        };

        if(!!apiKey) {
            var publications = $.getPublications(apiKey);
            if(publications.length === 0) {
                throw new Error('No publications were found');
            }
            
            var publication = publications[0];
            if(!!PublicationID) {
                publication = $.getItemByID(publications, PublicationID);
            }
            
            settings.PublicationID = publication.id;
            if(publication.type === 'issue') {
                var issues = $.getIssues(apiKey, settings.PublicationID);
                if(issues.length === 0) {
                    throw new Error('No issues were found on publication "' + publication.name + '"');
                }
                
                var issue = issues[0];
                settings.IssueID = issue.id;
            }

            var styles = $.getStyles(apiKey, settings.PublicationID);
            if(styles.length === 0) {
                throw new Error('No styles were found on publication "' + publication.name + '"');
            }
            var style = styles[0];
            settings.StyleID = style.id;
        }

        $.canvasflowSettings.save(settings);
    }

    $.process = function() {
        var savedSettings = $.savedSettings;
        if(!savedSettings) {
            savedSettings = JSON.parse($.defaultSavedSettings);
            $.savedSettings = savedSettings;
        }

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

        // Add endpoint selector
        var endpoints = [
            {
                name: 'Production',
                id: 'api.canvasflow.io'
            },
            {
                name: 'Development',
                id: 'api.cflowdev.com'
            }
        ];
        
        if(!!$.isInternal) { 
            settingsDialog.endpointDropDownGroup = settingsDialog.add('group');
            settingsDialog.endpointDropDownGroup.orientation = 'row';
            settingsDialog.endpointDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Endpoint");
            settingsDialog.endpointDropDownGroup.dropDown = settingsDialog.endpointDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(endpoints)});  
        } else {
            savedSettings.endpoint = endpoints[0].id;
        }
        
        if(!!savedSettings.endpoint) {
            $.canvasflowApi = new CanvasflowApi('http://' + savedSettings.endpoint + '/v2');
            if($.canvasflowApi.getHealth() === null) {
                throw new Error('Canvasflow Service not currently available');
            }
            endpointExist = true;
            selectedEndpoint = $.getItemByID(endpoints, savedSettings.endpoint);
            if(!!$.isInternal) { 
                settingsDialog.endpointDropDownGroup.dropDown.selection = $.getItemIndexByID(endpoints, savedSettings.endpoint);
            }

            //Add Api Key
            settingsDialog.apiKeyGroup = settingsDialog.add('group');
            settingsDialog.apiKeyGroup.orientation = 'row';
            settingsDialog.apiKeyGroup.add('statictext', [0, 0, labelWidth, 20], "API Key");
            settingsDialog.apiKeyGroup.apiKey = settingsDialog.apiKeyGroup.add('edittext', [0, 0, valuesWidth, 20], $.savedSettings.apiKey);
            
            if(!!savedSettings.apiKey) {
                apiKeyExist = true

                //Add Publication list
                publications = $.getPublications(savedSettings.apiKey);
                if(publications.length === 0) {
                    throw new Error('No publications were found');
                }
                
                settingsDialog.publicationDropDownGroup = settingsDialog.add('group');
                settingsDialog.publicationDropDownGroup.orientation = 'row';
                settingsDialog.publicationDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Publication");
                settingsDialog.publicationDropDownGroup.dropDown = settingsDialog.publicationDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(publications)});
                
                if(!!savedSettings.PublicationID) {
                    selectedPublication = $.getItemByID(publications, savedSettings.PublicationID);
                    if(selectedPublication === null) {
                        throw new Error('Publication with id "' + savedSettings.PublicationID + '" was not found')
                    }
                    
                    selection = $.getItemIndexByID(publications, savedSettings.PublicationID);
                    if(selection === null) {
                        throw new Error('Publication with id "' + savedSettings.PublicationID + '" was not found')
                    }
                    settingsDialog.publicationDropDownGroup.dropDown.selection = selection;
                } else {
                    selectedPublication = publications[0];
                    settingsDialog.publicationDropDownGroup.dropDown.selection = 0;
                }

                publicationType = selectedPublication.type;

                // Check if publication is an issue
                if(publicationType === 'issue') {
                    issues = $.getIssues(savedSettings.apiKey, selectedPublication.id);
                    
                    if(issues.length === 0) {
                        throw new Error('No issues were found on publication "' + publication.name + '"');
                    }
                    
                    settingsDialog.issueDropDownGroup = settingsDialog.add('group');
                    settingsDialog.issueDropDownGroup.orientation = 'row';
                    settingsDialog.issueDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Issue");
                    settingsDialog.issueDropDownGroup.dropDown = settingsDialog.issueDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(issues)})

                    if(!!savedSettings.IssueID) {
                        selection = $.getItemIndexByID(issues, savedSettings.IssueID);
                        if(selection === null) {
                            throw new Error('Issue with id "' + savedSettings.IssueID + '" was not found')
                        }
                        settingsDialog.issueDropDownGroup.dropDown.selection = selection
                    } else {
                        settingsDialog.issueDropDownGroup.dropDown.selection = 0;
                    }
                }

                // Add Preview Image selector
                var previewImageOptions = ['Yes', 'No'];
                settingsDialog.previewImageDropDownGroup = settingsDialog.add('group');
                settingsDialog.previewImageDropDownGroup.orientation = 'row';
                settingsDialog.previewImageDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Use preview images');
                settingsDialog.previewImageDropDownGroup.dropDown = settingsDialog.previewImageDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:previewImageOptions});
                if(savedSettings.previewImage === true ) {
                    $.savedSettings.previewImage = true;
                    settingsDialog.previewImageDropDownGroup.dropDown.selection = 0;
                } else {
                    $.savedSettings.previewImage = false;
                    settingsDialog.previewImageDropDownGroup.dropDown.selection = 1;
                }

                // Add Article Creation Mode 
                var creationModeOptions = ['Document', 'Page'];
                settingsDialog.creationModeDropDownGroup = settingsDialog.add('group');
                settingsDialog.creationModeDropDownGroup.orientation = 'row';
                settingsDialog.creationModeDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Article Creation');
                settingsDialog.creationModeDropDownGroup.dropDown = settingsDialog.creationModeDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:creationModeOptions});
                if(savedSettings.creationMode === 'document' ) {
                    $.savedSettings.creationMode = 'document';
                    settingsDialog.creationModeDropDownGroup.dropDown.selection = 0;
                } else {
                    $.savedSettings.creationMode = 'page';
                    settingsDialog.creationModeDropDownGroup.dropDown.selection = 1;
                }

                
                // Select styles
                styles = $.getStyles(savedSettings.apiKey, selectedPublication.id);
                if(styles.length === 0) {
                    throw new Error('No styles were found on publication "' + selectedPublication.name + '"');
                }

                settingsDialog.styleDropDownGroup = settingsDialog.add('group');
                settingsDialog.styleDropDownGroup.orientation = 'row';
                settingsDialog.styleDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Style");
                settingsDialog.styleDropDownGroup.dropDown = settingsDialog.styleDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(styles)})

                if(!!savedSettings.StyleID) {
                    selection = $.getItemIndexByID(styles, savedSettings.StyleID);
                    if(selection === null) {
                        throw new Error('Style with id "' + savedSettings.StyleID + '" was not found')
                    }
                    settingsDialog.styleDropDownGroup.dropDown.selection = selection
                } else {
                    settingsDialog.styleDropDownGroup.dropDown.selection = 0;
                }

                // Add Range selector
                settingsDialog.pagesGroup = settingsDialog.add('group');
                settingsDialog.pagesGroup.orientation = 'row';
                settingsDialog.pagesGroup.add('statictext', [0, 0, labelWidth, 20], "Pages");
                settingsDialog.pagesGroup.pages = settingsDialog.pagesGroup.add('edittext', [0, 0, valuesWidth, 20], $.savedSettings.pages);
            } else {
                apiKeyExist = false;
            }
        } else {
            selectedEndpoint = endpoints[0];
            if(!!$.isInternal) {
                settingsDialog.endpointDropDownGroup.dropDown.selection = 0;
            }
        }

        // Panel buttons
        settingsDialog.buttonsBarGroup = settingsDialog.add('group');
        settingsDialog.buttonsBarGroup.orientation = 'row';
        settingsDialog.buttonsBarGroup.alignChildren = 'bottom';    
        settingsDialog.buttonsBarGroup.cancelBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'Cancel');
        settingsDialog.buttonsBarGroup.saveBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'OK');
        
        settingsDialog.buttonsBarGroup.saveBtn.onClick = function() {
            $.savedSettings.previewImage = true;
            if(!!settingsDialog.previewImageDropDownGroup) {
                if(settingsDialog.previewImageDropDownGroup.dropDown.selection.index === 1) {
                    $.savedSettings.previewImage = false;
                }
            }

            $.savedSettings.creationMode = 'document';
            savedSettings.creationMode = 'document';

            if(!!settingsDialog.creationModeDropDownGroup) {
                if(settingsDialog.creationModeDropDownGroup.dropDown.selection.index === 1) {
                    $.savedSettings.creationMode = 'page';
                    savedSettings.creationMode = 'page';
                }
            }

            var pages = '';
            if(!!settingsDialog.pagesGroup) {
                pages = settingsDialog.pagesGroup.pages.text;
            }
            
            if(!!pages.length) {
                var results = /^([0-9]+)(-)+([0-9]+)$/.exec(pages)
                if(results === null) {
                    alert('The range for pages has an invalid syntax');
                    return;
                }

                var lowerRange = parseInt(results[1]);
                var higherRange = parseInt(results[3]);

                if(!lowerRange) {
                    alert('The lower range should be bigger than 0');
                    return;
                }

                if(!higherRange) {
                    alert('The higher range should be bigger than 0');
                    return;
                }

                if(lowerRange > higherRange) {
                    alert('The lower range should be smaller than the higher range ' + lowerRange + '>' + higherRange);
                    return;
                }
            }

            $.savedSettings.pages = pages;
            var endpointIndex = 0;
            if(!!$.isInternal) {
                endpointIndex = settingsDialog.endpointDropDownGroup.dropDown.selection.index;
            }
            if(!endpointExist) {
                $.reset(endpoints[endpointIndex].id);
                settingsDialog.close();
                $.show();
            } else {
                var endpoint = endpoints[endpointIndex].id;
                if(savedSettings.endpoint !== endpoints[endpointIndex].id) {
                    $.reset(endpoints[endpointIndex].id);
                    settingsDialog.close();
                    $.show();
                }

                $.canvasflowApi = new CanvasflowApi('http://' + endpoint + '/v2');

                if(!apiKeyExist) {    
                    $.validateKey(settingsDialog, endpoint);
                } else {
                    // The api key was already validated
                    if(savedSettings.apiKey !== settingsDialog.apiKeyGroup.apiKey.text) {
                        $.validateKey(settingsDialog, endpoint);
                    } else {
                        var PublicationID = publications[settingsDialog.publicationDropDownGroup.dropDown.selection.index].id;
                        if(savedSettings.PublicationID != PublicationID) {
                            $.reset(endpoint, savedSettings.apiKey, PublicationID);
                            settingsDialog.close();
                            $.show();
                        } else {
                            var StyleID;
                            try {
                                StyleID = styles[settingsDialog.styleDropDownGroup.dropDown.selection.index].id;
                            } catch(e) {
                                StyleID = '';
                            }
    
                            var IssueID;
                            try {
                                IssueID = issues[settingsDialog.issueDropDownGroup.dropDown.selection.index].id;
                            } catch(e) {
                                IssueID = '';
                            }
                            
                            savedSettings.PublicationID = PublicationID;
                            savedSettings.StyleID = StyleID;
                            savedSettings.IssueID = IssueID;
                            savedSettings.endpoint = selectedEndpoint.id;
    
                            $.canvasflowSettings.save(savedSettings);
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
        try {
            $.canvasflowSettings = new CanvasflowSettings($.canvasflowSettingsPath);
            $.savedSettings = $.canvasflowSettings.getSavedSettings();
            $.process()
        } catch(e) {
            alert(e.message);
        }
    };
}

