//@include "json2.js"
//@include "error.js"
//@include "api.js"
//@include "CanvasflowSettings.js"

var CanvasflowDialog = function(canvasflowSettingsPath, internal) {
    var $ = this;
    $.canvasflowSettings = new CanvasflowSettings(canvasflowSettingsPath);
    $.settingsDialog = new Window('dialog', 'Canvasflow Settings');
    $.isInternal = internal;
    $.defaultDialogSize = [300,100];
    $.canvasflowApi;
    $.isValidApiKey = false;
    $.settings = $.canvasflowSettings.getSavedSettings();

    $.publications = [];

    $.endpoints = [
        {
            name: 'Production',
            id: 'api.canvasflow.io'
        },
        {
            name: 'Development',
            id: 'api.cflowdev.com'
        }
    ];

    $.previewImageOptions = ['Yes', 'No'];
    $.creationModeOptions = ['Document', 'Page'];
    
    $.validateApiKey = function(canvasflowApi, apiKey) {
        var reply = canvasflowApi.validate(apiKey);
        var response = JSON.parse(reply);
        if(response.isValid) {
            return true;
        } else {
            return false;
        }
    }

    $.validateKey = function(settingsDialog, endpoint) {
        var reply = $.canvasflowApi.validate(settingsDialog.apiKeyGroup.apiKey.text);
        var response = JSON.parse(reply);
        if(response.isValid) {
            return true;
        } else {
            alert('The API key entered is not valid. Please check and try again');
            return false;
            
            // throw new Error(reply.replace(/(")/gi, ''))
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
        delete settings;
    }

    $.isValidPagesRangeSyntax = function(input) {
        results = /^([0-9]+)(-)+([0-9]+)$/.exec(input);
        var lowerRange = parseInt(results[1]);
        var higherRange = parseInt(results[3]);
        var totalOfPages = document.pages.length;

        if(!lowerRange) {
            alert('The lower range should be bigger than 0');
            return false;
        }

        if(!higherRange) {
            alert('The higher range should be bigger than 0');
            return false;
        }

        if(lowerRange > higherRange) {
            alert('The lower range should be smaller than the higher range');
            return false;
        }

        if(lowerRange > totalOfPages) {
            alert('The lower range "' + lowerRange + '" should be smaller than the total of pages "' + totalOfPages + '"');
            return false;
        }

        return true;
    }

    $.isValidPagesSyntax = function(input) {
        if(!!/^([0-9]+)(-)+([0-9]+)$/.exec(input)) {
            return $.isValidPagesRangeSyntax(input);
        } else if(!!/^(\d)+(,\d+)*$/.exec(input)) {
            return true;
        }

        alert('The range for pages has an invalid syntax');
        return false;
    }

    $.removeElementFromDialog = function(settingsDialog, element) {
        try { 
            if(!!element) {
                settingsDialog.remove(element);
            }
        } catch(e) {logError(e.message)}
    }

    $.hideStylesAndIssueSection = function(settingsDialog) {
        $.removeElementFromDialog(settingsDialog, settingsDialog.issueDropDownGroup);
        $.removeElementFromDialog(settingsDialog, settingsDialog.styleDropDownGroup);
    }

    $.hidePublication = function(settingsDialog) {
        $.settings.PublicationID = '';
        $.settings.IssueID = '';
        $.settings.StyleID = '';

        settingsDialog.publicationDropDownGroup.visible = false;
        settingsDialog.issueDropDownGroup.visible = false;
        settingsDialog.previewImageDropDownGroup.visible = false;
        settingsDialog.creationModeDropDownGroup.visible = false;
        settingsDialog.styleDropDownGroup.visible = false;
    }

    $.onPublicationChange = function(settingsDialog, selectedPublication) {
        var PublicationID = selectedPublication.id;
        $.settings.IssueID = '';
        $.settings.StyleID = '';
        if(selectedPublication.type === 'issue') {
            // Reset Issue
            $.displayIssues(settingsDialog, PublicationID);
        } else {
            settingsDialog.issueDropDownGroup.visible = false;
        }

        // Reset Style
        $.displayStyles(settingsDialog, PublicationID)
    }

    $.onEndpointChange = function(settingsDialog) {
        try {
            $.settings.apiKey = '';
            $.hidePublication(settingsDialog);
            settingsDialog.apiKeyGroup.apiKey.text = '';
    
            var endpointIndex = settingsDialog.endpointDropDownGroup.dropDown.selection.index;
            $.settings.endpoint = $.endpoints[endpointIndex].id;
            $.canvasflowApi = new CanvasflowApi('http://' + $.settings.endpoint + '/v2');
            settingsDialog.buttonsBarGroup.saveBtn.visible = false;
        } catch(e) {
            logError(e);
        }
    }

    $.onApiChange = function() {
        if(!!$.settingsDialog.apiKeyGroup.apiKey.text) {
            $.settingsDialog.buttonsBarGroup.saveBtn.enabled = true;
        } else {
            $.settingsDialog.buttonsBarGroup.saveBtn.enabled = false;
        }
    }

    $.displayIssues = function(settingsDialog, PublicationID) {
        $.issues = $.getIssues($.settings.apiKey, PublicationID);
        if($.issues.length === 0) {
            alert('This Publication has no Issues. Please create an Issue and try again.');
            return;
        }

        var selection = 0;
        var selectedIssue = $.issues[0];
        if(!!$.settings.IssueID) {
            
            selectedIssue = $.getItemByID($.issues, $.settings.IssueID);
            if(selectedIssue === null) {
                alert('The currently selected Issue does not exist. The first Issue in the current Publication has been selected');
                selection = 0;
                selectedIssue = $.issues[0];
            } else {
                selection = $.getItemIndexByID($.issues, selectedIssue.id);
            }
        }

        $.settings.IssueID = selectedIssue.id;
        var issuesNames = $.mapItemsName($.issues);

        settingsDialog.issueDropDownGroup.dropDown.removeAll()
        for(var i = 0; i < issuesNames.length; i++) {
            settingsDialog.issueDropDownGroup.dropDown.add('item', issuesNames[i]);
        }
        settingsDialog.issueDropDownGroup.dropDown.selection = selection;
        settingsDialog.issueDropDownGroup.visible = true;
    }

    $.displayStyles = function(settingsDialog, PublicationID) {
        $.styles = $.getStyles($.settings.apiKey, PublicationID);
        
        if($.styles.length === 0) {
            alert('This Publication has no Styles. Please create an Style and try again.');
            return;
        }

        var selectedStyle = $.styles[0];
        var selection = 0;
        if(!!$.settings.StyleID) {
            selectedStyle = $.getItemByID($.styles, $.settings.StyleID);
            if(selectedStyle === null) {
                alert('The currently selected Style does not exist. The first Style in the current Publication has been selected');
                selection = 0;
                selectedStyle = $.styles[0];
            } else {
                selection = $.getItemIndexByID($.styles, selectedStyle.id);
            }
        }

        $.settings.StyleID = '' + selectedStyle.id;
        var stylesNames = $.mapItemsName($.styles);

        settingsDialog.styleDropDownGroup.dropDown.removeAll();
        for(var i = 0; i < stylesNames.length; i++) {
            settingsDialog.styleDropDownGroup.dropDown.add('item', stylesNames[i]);
        }
        settingsDialog.styleDropDownGroup.dropDown.selection = selection;
        settingsDialog.styleDropDownGroup.visible = true;
    }

    $.displayPublications = function(settingsDialog) {
        $.publications = $.getPublications($.settings.apiKey);
        if($.publications.length === 0) {
            throw new Error('No publications were found');
        }

        var selectedPublication = $.publications[0];
        if(!!$.settings.PublicationID) {
            selectedPublication = $.getItemByID($.publications, $.settings.PublicationID);
        }

        $.settings.PublicationID = selectedPublication.id;

        var publicationsNames = $.mapItemsName($.publications);
        settingsDialog.publicationDropDownGroup.dropDown.removeAll()
        for(var i = 0; i < publicationsNames.length; i++) {
            settingsDialog.publicationDropDownGroup.dropDown.add('item', publicationsNames[i]);
        }
        settingsDialog.publicationDropDownGroup.dropDown.selection = $.getItemIndexByID($.publications, selectedPublication.id);
        settingsDialog.publicationDropDownGroup.visible = true;
        
        if(selectedPublication.type === 'issue') {
            $.displayIssues(settingsDialog, $.settings.PublicationID);
        }

        $.displayStyles(settingsDialog, $.settings.PublicationID);
    }

    $.displayPreviewImage = function(settingsDialog) {
        settingsDialog.previewImageDropDownGroup.visible = true;
        var previewImage = false;
        var selection = 1;
        if($.settings.previewImage === true) {
            previewImage = true;
            selection = 0;
        }

        $.settings.previewImage = previewImage;
        settingsDialog.previewImageDropDownGroup.dropDown.selection = selection;
    }

    $.displayArticleCreationMode = function(settingsDialog) {
        settingsDialog.creationModeDropDownGroup.visible = true;
        var selection = 0;
        var creationMode = 'document';
        if($.settings.creationMode === 'page') {
            creationMode = 'page';
            selection = 1;
        }

        $.settings.creationMode = creationMode;

        settingsDialog.creationModeDropDownGroup.dropDown.selection = selection;
    }

    $.hideAll = function(settingsDialog) {
        $.settings.PublicationID = '';
        $.settings.IssueID = '';
        $.settings.StyleID = '';

        settingsDialog.publicationDropDownGroup.visible = false;
        settingsDialog.issueDropDownGroup.visible = false;
        settingsDialog.previewImageDropDownGroup.visible = false;
        settingsDialog.creationModeDropDownGroup.visible = false;
        settingsDialog.styleDropDownGroup.visible = false;
    }

    $.process = function() {
        var valuesWidth = 200;
        var labelWidth = 150;

        // ENDPOINTS
        $.settingsDialog.endpointDropDownGroup = $.settingsDialog.add('group', undefined, 'endpoint');
        $.settingsDialog.endpointDropDownGroup.orientation = 'row';
        $.settingsDialog.endpointDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Endpoint');
        $.settingsDialog.endpointDropDownGroup.dropDown = $.settingsDialog.endpointDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName($.endpoints)});
        
        var selectedEndpoint = $.endpoints[0];
        if(!$.isInternal) { 
            $.settingsDialog.endpointDropDownGroup.visible = false;
            $.settings.endpoint = selectedEndpoint.id;   
        } else {
            $.settingsDialog.endpointDropDownGroup.visible = true;
            if(!!$.settings.endpoint) {
                selectedEndpoint = $.getItemByID($.endpoints, $.settings.endpoint);
            }

            $.settingsDialog.endpointDropDownGroup.dropDown.selection = $.getItemIndexByID($.endpoints, selectedEndpoint.id);
            $.settingsDialog.endpointDropDownGroup.dropDown.onChange = function () {
                $.settings.endpoint = $.endpoints[$.settingsDialog.endpointDropDownGroup.dropDown.selection.index].id;
                $.onEndpointChange($.settingsDialog);
            }
        }

        $.canvasflowApi = new CanvasflowApi('http://' + selectedEndpoint.id + '/v2');
        if($.canvasflowApi.getHealth() === null) {
            throw new Error('Canvasflow Service not currently available');
        }

        // API KEY
        $.settingsDialog.apiKeyGroup = $.settingsDialog.add('group');
        $.settingsDialog.apiKeyGroup.orientation = 'row';
        $.settingsDialog.apiKeyGroup.add('statictext', [0, 0, labelWidth, 20], 'API Key');
        $.settingsDialog.apiKeyGroup.apiKey = $.settingsDialog.apiKeyGroup.add('edittext', [0, 0, valuesWidth, 20], '');
        $.settingsDialog.apiKeyGroup.visible = true;
        if(!!$.settings.apiKey) {
            $.settingsDialog.apiKeyGroup.apiKey.text = $.settings.apiKey;
            $.isValidApiKey = $.validateApiKey($.canvasflowApi, $.settings.apiKey)
            if(!$.isValidApiKey) {
                alert('The API key entered is not valid. Please check and try again.');
            }
        }
        $.settingsDialog.apiKeyGroup.apiKey.onChange = function () {
            $.hideAll($.settingsDialog);

            var apiKey = $.settingsDialog.apiKeyGroup.apiKey.text;

            $.isValidApiKey = $.validateApiKey($.canvasflowApi, apiKey);
            if(!$.isValidApiKey) {
                $.settingsDialog.buttonsBarGroup.saveBtn.visible = false;
                $.hidePublication($.settingsDialog);
                alert('The API key entered is not valid. Please check and try again.');
                return;
            }

            try {
                $.settings.apiKey = apiKey;
                $.displayPublications($.settingsDialog);
                $.displayPreviewImage($.settingsDialog);
                $.displayArticleCreationMode($.settingsDialog);
                $.settingsDialog.pagesGroup.visible = true;
                $.settingsDialog.buttonsBarGroup.saveBtn.visible = true;
            } catch(e) {
                logError(e);
            }
        }

        // PUBLICATION
        $.settingsDialog.publicationDropDownGroup = $.settingsDialog.add('group', undefined, 'publications');
        $.settingsDialog.publicationDropDownGroup.orientation = 'row';
        $.settingsDialog.publicationDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Publication');
        $.settingsDialog.publicationDropDownGroup.dropDown = $.settingsDialog.publicationDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:[]});
        $.settingsDialog.publicationDropDownGroup.visible = false;
        $.settingsDialog.publicationDropDownGroup.dropDown.onChange = function() {
            var selectedPublication = $.publications[$.settingsDialog.publicationDropDownGroup.dropDown.selection.index];
            if(!!$.settings.PublicationID) {
                if($.settings.PublicationID != selectedPublication.id) {
                    $.settings.PublicationID = selectedPublication.id;
                    $.onPublicationChange($.settingsDialog, selectedPublication);
                }
            } else {
                $.settings.PublicationID = selectedPublication.id;
                $.onPublicationChange($.settingsDialog, selectedPublication);
            }
        }

        // ISSUES
        $.settingsDialog.issueDropDownGroup = $.settingsDialog.add('group', undefined, 'issues');
        $.settingsDialog.issueDropDownGroup.orientation = 'row';
        $.settingsDialog.issueDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Issue');
        $.settingsDialog.issueDropDownGroup.dropDown = $.settingsDialog.issueDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:[]});
        $.settingsDialog.issueDropDownGroup.visible = false;
        $.settingsDialog.issueDropDownGroup.dropDown.onChange = function() {
            $.settings.IssueID = $.issues[$.settingsDialog.issueDropDownGroup.dropDown.selection.index].id;
        }

        // PREVIEW IMAGE
        $.settingsDialog.previewImageDropDownGroup = $.settingsDialog.add('group', undefined, 'previewImage');
        $.settingsDialog.previewImageDropDownGroup.orientation = 'row';
        $.settingsDialog.previewImageDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Use preview images');
        $.settingsDialog.previewImageDropDownGroup.dropDown = $.settingsDialog.previewImageDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.previewImageOptions});
        $.settingsDialog.previewImageDropDownGroup.visible = false;
        $.settingsDialog.previewImageDropDownGroup.dropDown.onChange = function() {
            if($.settingsDialog.previewImageDropDownGroup.dropDown.selection.index === 0) {
                $.settings.previewImage = true;
            } else {
                $.settings.previewImage = false;
            }
        }

        // Add Article Creation Mode 
        var creationModeOptions = ['Document', 'Page'];
        $.settingsDialog.creationModeDropDownGroup = $.settingsDialog.add('group', undefined, 'creationMode');
        $.settingsDialog.creationModeDropDownGroup.orientation = 'row';
        $.settingsDialog.creationModeDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Article Creation');
        $.settingsDialog.creationModeDropDownGroup.dropDown = $.settingsDialog.creationModeDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:creationModeOptions});
        $.settingsDialog.creationModeDropDownGroup.visible = false;
        $.settingsDialog.creationModeDropDownGroup.dropDown.onChange = function() {
            if($.settingsDialog.creationModeDropDownGroup.dropDown.selection.index === 0) {
                $.settings.creationMode = 'document';
            } else {
                $.settings.creationMode = 'page';
            }
        }

        // STYLES
        $.settingsDialog.styleDropDownGroup = $.settingsDialog.add('group', undefined, 'styles');
        $.settingsDialog.styleDropDownGroup.orientation = 'row';
        $.settingsDialog.styleDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Style');
        $.settingsDialog.styleDropDownGroup.dropDown = $.settingsDialog.styleDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:[]});
        $.settingsDialog.styleDropDownGroup.visible = false;
        $.settingsDialog.styleDropDownGroup.dropDown.onChange = function() {
            $.settings.StyleID = '' + $.styles[$.settingsDialog.styleDropDownGroup.dropDown.selection.index].id;
        }

        // API KEY
        $.settingsDialog.pagesGroup = $.settingsDialog.add('group');
        $.settingsDialog.pagesGroup.orientation = 'row';
        $.settingsDialog.pagesGroup.add('statictext', [0, 0, labelWidth, 20], 'Publish Pages');
        $.settingsDialog.pagesGroup.pages = $.settingsDialog.pagesGroup.add('edittext', [0, 0, valuesWidth, 20], '');
        $.settingsDialog.pagesGroup.visible = false;
        if(!!$.settings.pages) {
            $.settingsDialog.pagesGroup.pages.text = $.settings.pages;
        }

        if(!!$.isValidApiKey) {
            $.displayPublications($.settingsDialog);
            $.displayPreviewImage($.settingsDialog);
            $.displayArticleCreationMode($.settingsDialog);
            $.settingsDialog.pagesGroup.visible = true;
        }

        // Panel buttons
        $.settingsDialog.buttonsBarGroup = $.settingsDialog.add('group', undefined, 'buttons');
        $.settingsDialog.buttonsBarGroup.orientation = 'row';
        $.settingsDialog.buttonsBarGroup.alignChildren = 'bottom';    
        $.settingsDialog.buttonsBarGroup.cancelBtn = $.settingsDialog.buttonsBarGroup.add('button', undefined, 'Cancel');
        $.settingsDialog.buttonsBarGroup.saveBtn = $.settingsDialog.buttonsBarGroup.add('button', undefined, 'Save');
        $.settingsDialog.buttonsBarGroup.saveBtn.visible = false;
        if(!!$.isValidApiKey) {
            $.settingsDialog.buttonsBarGroup.saveBtn.visible = true;
        }
        $.settingsDialog.buttonsBarGroup.saveBtn.onClick = function() {
            try {
                $.settings.apiKey = $.settingsDialog.apiKeyGroup.apiKey.text;
                $.settings.endpoint = $.endpoints[0].id;
                if(!!$.isInternal) { 
                    $.settings.endpoint = $.endpoints[$.settingsDialog.endpointDropDownGroup.dropDown.selection.index].id; 
                }

                var pages = $.settingsDialog.pagesGroup.pages.text;
                
                if(!!pages.length) {
                    if(!$.isValidPagesSyntax(pages)) {
                        return;
                    }
                }

                $.settings.pages = pages;
                
                $.canvasflowSettings.save($.settings);
                $.settingsDialog.close();
            }catch(e) {
                logError(e);
            }
            
        }
        
        $.settingsDialog.buttonsBarGroup.cancelBtn.onClick = function() {
            $.settingsDialog.close();
        }
        $.settingsDialog.show();
    };

    $.show = function() {
        try {
            $.settingsDialog.orientation = 'column';
            $.settingsDialog.alignment = 'right';
            $.settingsDialog.preferredSize = $.defaultDialogSize;
            $.process()
        } catch(e) {
            logError(e);
        }
    };
}
