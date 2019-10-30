//@include "json2.js"
//@include "error.js"
//@include "Array.js"
//@include "CanvasflowApi.js"
//@include "Settings.js"

var SettingsDialog = function(canvasflowSettingsPath, internal, logger) {
    var $ = this;
    $.canvasflowSettings = new Settings(canvasflowSettingsPath);
    $.settingsDialog = new Window('dialog', 'Canvasflow Settings');
    $.isInternal = internal;
    $.defaultDialogSize = [300,100];
    $.canvasflowApi;
    $.isValidApiKey = false;
    $.settings = $.canvasflowSettings.getSavedSettings();

    $.valuesWidth = 300;
    $.defaultLabelDim = [0, 0, 150, 20];
    $.defaultValueDim = [0, 0, $.valuesWidth, 20];

    $.publications = [];
    $.publicationType;

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

    $.creationModeOptions = ['Document', 'Page'];
    
    $.validateApiKey = function(canvasflowApi, apiKey) {
        var response = canvasflowApi.validate(apiKey);
        if(response.isValid) {
            return true;
        } else {
            return false;
        }
    }

    $.getPublications = function(apiKey) {
        return $.canvasflowApi.getPublications(apiKey);
    };

    $.getIssues = function(apiKey, PublicationID) {
        return $.canvasflowApi.getIssues(apiKey, PublicationID);
    };

    $.getStyles = function(apiKey, PublicationID) {
        return $.canvasflowApi.getStyles(apiKey, PublicationID);
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
        var matches = items.filter(function(item) {
            return item.id == id;
        });
        return !!matches.length ? matches[0] : null;
    }

    $.mapItemsName = function(items) {
        var response = [];
        for(var i = 0; i< items.length; i++) {
            response.push(items[i].name);
        }
        return response;
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

    $.hidePublication = function(settingsDialog) {
        $.settings.PublicationID = '';
        $.settings.IssueID = '';
        $.settings.StyleID = '';

        settingsDialog.publicationDropDownGroup.visible = false;
        settingsDialog.issueDropDownGroup.visible = false;
        settingsDialog.creationModeDropDownGroup.visible = false;
        settingsDialog.contentOrderDropDownGroup.visible = false;
        settingsDialog.styleDropDownGroup.visible = false;
        settingsDialog.pagesGroup.visible = false;
    }

    $.onPublicationChange = function(settingsDialog, selectedPublication) {
        var PublicationID = selectedPublication.id;
        $.settings.IssueID = '';
        $.settings.StyleID = '';
        if(selectedPublication.type === 'issue') {
            $.publicationType = 'issue';
            // Reset Issue
            $.displayIssues(settingsDialog, PublicationID);
        } else {
            $.publicationType = 'article';
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
            logger.logError(e);
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
        var issues = [];
        $.issues = $.getIssues($.settings.apiKey, PublicationID);
        for(var i = 0; i < $.issues.length; i++) {
            var issue = $.issues[i];
            if(!!issue.id) {
                issues.push(issue);
            }
        }
        $.issues = issues;

        if($.issues.length === 0) {
            alert('This Publication has no Issues. Please create an Issue and try again.');
            $.settings.IssueID = '';
            return;
        }

        var selection = 0;
        var selectedIssue = $.issues[0];
        if(!!$.settings.IssueID) {
            selectedIssue = $.getItemByID($.issues, $.settings.IssueID);
            if(selectedIssue === null) {
                alert('The currently selected Issue does not exist. \nThe first Issue in the current Publication has been selected. Please click Save to update the change.');
                $.settings.IssueID = '';
                $.displayIssues(settingsDialog, PublicationID);
                return;
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
                alert('The currently selected Style does not exist. \nThe first Style in the current Publication has been selected. Please click Save to update the change.');
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
        
        $.publicationType = 'article';
        if(selectedPublication.type === 'issue') {
            $.publicationType = 'issue';
            $.displayIssues(settingsDialog, $.settings.PublicationID);
        }

        $.displayStyles(settingsDialog, $.settings.PublicationID);
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

    $.displayArticleContentOrder = function(settingsDialog) {
        settingsDialog.contentOrderDropDownGroup.visible = true;
        var selection = 0;
        var contentOrder = 'natural';
        if($.settings.contentOrder === 'textFirst') {
            contentOrder = 'textFirst';
            selection = 1;
        }

        $.settings.contentOrder = contentOrder;

        settingsDialog.contentOrderDropDownGroup.dropDown.selection = selection;
    }

    $.hideAll = function(settingsDialog) {
        $.settings.PublicationID = '';
        $.settings.IssueID = '';
        $.settings.StyleID = '';

        settingsDialog.publicationDropDownGroup.visible = false;
        settingsDialog.issueDropDownGroup.visible = false;
        settingsDialog.creationModeDropDownGroup.visible = false;
        settingsDialog.styleDropDownGroup.visible = false;
        settingsDialog.pagesGroup.visible = false;
    }

    $.createDropDownList = function(dropDownGroup, items) {
        return dropDownGroup.add('dropdownlist', $.defaultValueDim, undefined, {items: !!items ? items : []});
    }

    $.renderWindow = function() {
        var valuesWidth = $.valuesWidth;
        var defaultLabelDim = $.defaultLabelDim;
        var defaultValueDim = $.defaultValueDim;

        // ENDPOINTS
        $.settingsDialog.endpointDropDownGroup = $.settingsDialog.add('group', undefined, 'endpoint');
        $.settingsDialog.endpointDropDownGroup.orientation = 'row';
        $.settingsDialog.endpointDropDownGroup.add('statictext', defaultLabelDim, 'Endpoint');
        $.settingsDialog.endpointDropDownGroup.dropDown = $.createDropDownList($.settingsDialog.endpointDropDownGroup, $.mapItemsName($.endpoints));
        
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
        $.settingsDialog.apiKeyGroup.add('statictext', defaultLabelDim, 'API Key');
        $.settingsDialog.apiKeyGroup.apiKey = $.settingsDialog.apiKeyGroup.add('edittext', [0, 0, valuesWidth * 0.72, 20], '');
        $.settingsDialog.apiKeyGroup.testApiKeyBtn = $.settingsDialog.apiKeyGroup.add('button', [0, 0, valuesWidth * 0.25, 20], '&Validate');
        $.settingsDialog.apiKeyGroup.testApiKeyBtn.helpTip = 'Check if the api key is valid and loads the defaults values for the account';
        $.settingsDialog.apiKeyGroup.testApiKeyBtn.shortcutKey = 'v';
        $.settingsDialog.apiKeyGroup.testApiKeyBtn.onClick = function() {
            $.hideAll($.settingsDialog);
            var apiKey = $.settingsDialog.apiKeyGroup.apiKey.text.replace(/\s/g,'');
            $.settingsDialog.apiKeyGroup.apiKey.text = apiKey;

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
                $.displayArticleCreationMode($.settingsDialog);
                $.displayArticleContentOrder($.settingsDialog);
                $.settingsDialog.pagesGroup.visible = true;
                $.settingsDialog.buttonsBarGroup.saveBtn.visible = true;
            } catch(e) {
                logger.logError(e);
            }
        }
        $.settingsDialog.apiKeyGroup.visible = true;
        if(!!$.settings.apiKey) {
            $.settingsDialog.apiKeyGroup.apiKey.text = $.settings.apiKey;
            $.isValidApiKey = $.validateApiKey($.canvasflowApi, $.settings.apiKey)
            if(!$.isValidApiKey) {
                alert('The API key entered is not valid. Please check and try again.');
            }
        }
        $.settingsDialog.apiKeyGroup.apiKey.onChanging = function () {
            $.settingsDialog.buttonsBarGroup.saveBtn.visible = false;
            $.hideAll($.settingsDialog);
        }

        // PUBLICATION
        $.settingsDialog.publicationDropDownGroup = $.settingsDialog.add('group', undefined, 'publications');
        $.settingsDialog.publicationDropDownGroup.orientation = 'row';
        $.settingsDialog.publicationDropDownGroup.add('statictext', defaultLabelDim, 'Publication');
        $.settingsDialog.publicationDropDownGroup.dropDown = $.createDropDownList($.settingsDialog.publicationDropDownGroup);
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
        $.settingsDialog.issueDropDownGroup.add('statictext', defaultLabelDim, 'Issue');
        $.settingsDialog.issueDropDownGroup.dropDown = $.createDropDownList($.settingsDialog.issueDropDownGroup);
        $.settingsDialog.issueDropDownGroup.visible = false;
        $.settingsDialog.issueDropDownGroup.dropDown.onChange = function() {
            $.settings.IssueID = $.issues[$.settingsDialog.issueDropDownGroup.dropDown.selection.index].id;
        }

        // Add Article Creation Mode 
        var creationModeOptions = ['Document', 'Page'];
        $.settingsDialog.creationModeDropDownGroup = $.settingsDialog.add('group', undefined, 'creationMode');
        $.settingsDialog.creationModeDropDownGroup.orientation = 'row';
        $.settingsDialog.creationModeDropDownGroup.add('statictext', defaultLabelDim, 'Article Creation');
        $.settingsDialog.creationModeDropDownGroup.dropDown = $.createDropDownList($.settingsDialog.creationModeDropDownGroup, creationModeOptions);
        $.settingsDialog.creationModeDropDownGroup.visible = false;
        $.settingsDialog.creationModeDropDownGroup.dropDown.onChange = function() {
            if($.settingsDialog.creationModeDropDownGroup.dropDown.selection.index === 0) {
                $.settings.creationMode = 'document';
            } else {
                $.settings.creationMode = 'page';
            }
        }

        // Add Article Content Order
        // var contentOrderOptions = ['Natural', 'Separate Images'];
        var contentOrderOptions = ['Natural'];
        $.settingsDialog.contentOrderDropDownGroup = $.settingsDialog.add('group', undefined, 'contentOrder');
        $.settingsDialog.contentOrderDropDownGroup.orientation = 'row';
        $.settingsDialog.contentOrderDropDownGroup.add('statictext', defaultLabelDim, 'Content Ordering');
        $.settingsDialog.contentOrderDropDownGroup.dropDown = $.createDropDownList($.settingsDialog.contentOrderDropDownGroup, contentOrderOptions);
        $.settingsDialog.contentOrderDropDownGroup.visible = false;
        $.settingsDialog.contentOrderDropDownGroup.dropDown.onChange = function() {
            if($.settingsDialog.contentOrderDropDownGroup.dropDown.selection.index === 0) {
                $.settings.contentOrder = 'natural';
            } else {
                $.settings.contentOrder = 'textFirst';
            }
        }

        // STYLES
        $.settingsDialog.styleDropDownGroup = $.settingsDialog.add('group', undefined, 'styles');
        $.settingsDialog.styleDropDownGroup.orientation = 'row';
        $.settingsDialog.styleDropDownGroup.add('statictext', defaultLabelDim, 'Style');
        $.settingsDialog.styleDropDownGroup.dropDown = $.createDropDownList($.settingsDialog.styleDropDownGroup);
        $.settingsDialog.styleDropDownGroup.visible = false;
        $.settingsDialog.styleDropDownGroup.dropDown.onChange = function() {
            $.settings.StyleID = '' + $.styles[$.settingsDialog.styleDropDownGroup.dropDown.selection.index].id;
        }

        // API KEY
        $.settingsDialog.pagesGroup = $.settingsDialog.add('group');
        $.settingsDialog.pagesGroup.orientation = 'row';
        $.settingsDialog.pagesGroup.add('statictext', defaultLabelDim, 'Publish Pages');
        $.settingsDialog.pagesGroup.pages = $.settingsDialog.pagesGroup.add('edittext', defaultValueDim, '');
        $.settingsDialog.pagesGroup.visible = false;
        if(!!$.settings.pages) {
            $.settingsDialog.pagesGroup.pages.text = $.settings.pages;
        }

        if(!!$.isValidApiKey) {
            $.displayPublications($.settingsDialog);
            $.displayArticleCreationMode($.settingsDialog);
            $.displayArticleContentOrder($.settingsDialog);
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

                if($.publicationType === 'issue' && !$.settings.IssueID) {
                    alert('This Publication has no Issues. Please create an Issue and try again.');
                    return
                }
                
                $.canvasflowSettings.save($.settings);
                $.settingsDialog.close();
            }catch(e) {
                logger.logError(e);
            }
            
        }
        
        $.settingsDialog.buttonsBarGroup.cancelBtn.onClick = function() {
            $.settingsDialog.close();
        }
        $.settingsDialog.show();
    };

    $.show = function() {
        $.settingsDialog.orientation = 'column';
        $.settingsDialog.alignment = 'right';
        $.settingsDialog.preferredSize = $.defaultDialogSize;
        $.renderWindow()
    };
}

