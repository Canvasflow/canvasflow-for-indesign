class SettingsDialog {
    canvasflowSettings: Settings;
    settingsDialog: any;
    isInternal: boolean;
    defaultDialogSize: Array<number>;
    canvasflowApi: CanvasflowApi;
    isValidApiKey: boolean;
    settings: any;
    valuesWidth: number;
    defaultLabelDim: Array<number>;
    defaultValueDim: Array<number>;

    publications: Array<any>;
    issues: Array<any>;
    styles: Array<any>;

    templateDefault: any;
    templates: Array<any>;
    selectedTemplate: any;

    publicationType: string;
    endpoints: Array<any>;
    creationModeOptions: Array<string>;

    logger: Logger;
    document: Document;

    constructor(canvasflowSettingsPath: string, internal: boolean, logger: Logger) {
        this.canvasflowSettings = new Settings(canvasflowSettingsPath);
        
        // @ts-ignore
        this.settingsDialog = new Window('dialog', 'Canvasflow Settings');

        this.isInternal = internal;
        this.defaultDialogSize = [300,100];
        this.isValidApiKey = false;
        this.settings = this.canvasflowSettings.getSavedSettings();

        this.valuesWidth = 300;
        this.defaultLabelDim = [0, 0, 150, 20];
        this.defaultValueDim = [0, 0, this.valuesWidth, 20];

        this.publications = [];
        this.templateDefault = {
            id: '-1',
            name: 'None',
            StyleID: ''
        }
        this.templates = [this.templateDefault];

        this.endpoints = [
            {
                name: 'Production',
                id: 'api.canvasflow.io'
            },
            {
                name: 'Development',
                id: 'api.cflowdev.com'
            }
        ];

        this.logger = logger;
        this.document = app.activeDocument;

        this.creationModeOptions = ['Document', 'Page'];
    }

    validateApiKey(canvasflowApi, apiKey) {
        var response = canvasflowApi.validate(apiKey);
        if(response.isValid) {
            return true;
        } else {
            return false;
        }
    }

    getPublications(apiKey) {
        return this.canvasflowApi.getPublications(apiKey);
    };

    getIssues(apiKey, PublicationID) {
        return this.canvasflowApi.getIssues(apiKey, PublicationID);
    };

    getStyles(apiKey, PublicationID) {
        return this.canvasflowApi.getStyles(apiKey, PublicationID);
    };

    getTemplates(apiKey, PublicationID) {
        return this.canvasflowApi.getTemplates(apiKey, PublicationID);
    }

    getItemIndexByID(items, id) {
        for(var i = 0; i< items.length; i++) {
            if(items[i].id == id) {
                return i;
            }
        }
        return null;
    }

    getItemByID(items, id) {
        var matches = items.filter(item => item.id == id);
        return !!matches.length ? matches[0] : null;
    }

    mapItemsName(items) {
        var response = [];
        for(var i = 0; i< items.length; i++) {
            response.push(items[i].name);
        }
        return response;
    }

    isValidPagesRangeSyntax(input) {
        const results = /^([0-9]+)(-)+([0-9]+)$/.exec(input);
        const lowerRange = parseInt(results[1]);
        const higherRange = parseInt(results[3]);
        const totalOfPages = this.document.pages.length;

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

    isValidPagesSyntax(input) {
        if(!!/^([0-9]+)(-)+([0-9]+)$/.exec(input)) {
            return this.isValidPagesRangeSyntax(input);
        } else if(!!/^(\d)+(,\d+)*$/.exec(input)) {
            return true;
        }

        alert('The range for pages has an invalid syntax');
        return false;
    }

    hidePublication(settingsDialog) {
        this.settings.PublicationID = '';
        this.settings.IssueID = '';
        this.settings.StyleID = '';

        settingsDialog.publicationDropDownGroup.visible = false;
        settingsDialog.issueDropDownGroup.visible = false;
        settingsDialog.creationModeDropDownGroup.visible = false;
        settingsDialog.contentOrderDropDownGroup.visible = false;
        settingsDialog.styleDropDownGroup.visible = false;
        settingsDialog.pagesGroup.visible = false;
    }

    onPublicationChange(settingsDialog, selectedPublication) {
        var PublicationID = selectedPublication.id;
        this.settings.IssueID = '';
        this.settings.StyleID = '';
        if(selectedPublication.type === 'issue') {
            this.publicationType = 'issue';
            // Reset Issue
            this.displayIssues(settingsDialog, PublicationID);
        } else {
            this.publicationType = 'article';
            settingsDialog.issueDropDownGroup.visible = false;
        }

        // Reset Template
        this.displayTemplates(settingsDialog, PublicationID);

        // Reset Style
        this.displayStyles(settingsDialog, PublicationID);
    }

    onEndpointChange(settingsDialog) {
        try {
            this.settings.apiKey = '';
            this.hidePublication(settingsDialog);
            settingsDialog.apiKeyGroup.apiKey.text = '';
    
            var endpointIndex = settingsDialog.endpointDropDownGroup.dropDown.selection.index;
            this.settings.endpoint = this.endpoints[endpointIndex].id;
            this.canvasflowApi = new CanvasflowApi('http://' + this.settings.endpoint + '/v2');
            settingsDialog.buttonsBarGroup.saveBtn.visible = false;
        } catch(e) {
            logger.logError(e);
        }
    }

    onApiChange() {
        if(!!this.settingsDialog.apiKeyGroup.apiKey.text) {
            this.settingsDialog.buttonsBarGroup.saveBtn.enabled = true;
        } else {
            this.settingsDialog.buttonsBarGroup.saveBtn.enabled = false;
        }
    }

    onTemplateChange() {
        var selectedTemplate = this.templates[0];
        if(this.settings.TemplateID != '-1') {
            selectedTemplate = this.getItemByID(this.templates, this.settings.TemplateID);
            if(selectedTemplate === null) {
                selectedTemplate = this.templates[0];
            }
        }
        this.selectedTemplate = selectedTemplate;
        this.displayStyles(this.settingsDialog, this.settings.PublicationID);
    }

    displayIssues(settingsDialog, PublicationID) {
        var issues = [];
        this.issues = this.getIssues(this.settings.apiKey, PublicationID);
        for(var i = 0; i < this.issues.length; i++) {
            var issue = this.issues[i];
            if(!!issue.id) {
                issues.push(issue);
            }
        }
        this.issues = issues;

        if(this.issues.length === 0) {
            alert('This Publication has no Issues. Please create an Issue and try again.');
            this.settings.IssueID = '';
            return;
        }

        var selection = 0;
        var selectedIssue = this.issues[0];
        if(!!this.settings.IssueID) {
            selectedIssue = this.getItemByID(this.issues, this.settings.IssueID);
            if(selectedIssue === null) {
                alert('The currently selected Issue does not exist. \nThe first Issue in the current Publication has been selected. Please click Save to update the change.');
                this.settings.IssueID = '';
                this.displayIssues(settingsDialog, PublicationID);
                return;
            } else {
                selection = this.getItemIndexByID(this.issues, selectedIssue.id);
            }
        }

        this.settings.IssueID = selectedIssue.id;
        var issuesNames = this.mapItemsName(this.issues);

        settingsDialog.issueDropDownGroup.dropDown.removeAll()
        for(var i = 0; i < issuesNames.length; i++) {
            settingsDialog.issueDropDownGroup.dropDown.add('item', issuesNames[i]);
        }
        settingsDialog.issueDropDownGroup.dropDown.selection = selection;
        settingsDialog.issueDropDownGroup.visible = true;
    }

    displayTemplates(settingsDialog, PublicationID) {
        this.templates = [this.templateDefault].concat(this.getTemplates(this.settings.apiKey, PublicationID));

        var selectedTemplate = this.templates[0];
        var selection = 0;
        if(this.settings.TemplateID != '-1') {
            selectedTemplate = this.getItemByID(this.templates, this.settings.TemplateID);
            if(selectedTemplate === null) {
                selection = 0;
                selectedTemplate = this.templates[0];
            } else {
                selection = this.getItemIndexByID(this.templates, selectedTemplate.id);
            }
        }

        this.selectedTemplate = selectedTemplate;

        this.settings.TemplateID = '' + selectedTemplate.id;
        var templatesNames = this.mapItemsName(this.templates);

        settingsDialog.templateDropDownGroup.dropDown.removeAll();
        for(var i = 0; i < templatesNames.length; i++) {
            settingsDialog.templateDropDownGroup.dropDown.add('item', templatesNames[i]);
        }
        settingsDialog.templateDropDownGroup.dropDown.selection = selection;
        settingsDialog.templateDropDownGroup.visible = true;
    }

    displayStyles(settingsDialog, PublicationID) {
        if(this.selectedTemplate.id != '-1') {
            this.settings.StyleID = '' + this.selectedTemplate.StyleID;
            settingsDialog.styleDropDownGroup.enabled = false;
        } else {
            settingsDialog.styleDropDownGroup.enabled = true;
        }

        this.styles = this.getStyles(this.settings.apiKey, PublicationID);
        
        if(this.styles.length === 0) {
            alert('This Publication has no Styles. Please create an Style and try again.');
            return;
        }

        var selectedStyle = this.styles[0];
        var selection = 0;
        if(!!this.settings.StyleID) {
            selectedStyle = this.getItemByID(this.styles, this.settings.StyleID);
            if(selectedStyle === null) {
                alert('The currently selected Style does not exist. \nThe first Style in the current Publication has been selected. Please click Save to update the change.');
                selection = 0;
                selectedStyle = this.styles[0];
            } else {
                selection = this.getItemIndexByID(this.styles, selectedStyle.id);
            }
        }

        this.settings.StyleID = '' + selectedStyle.id;
        var stylesNames = this.mapItemsName(this.styles);

        settingsDialog.styleDropDownGroup.dropDown.removeAll();
        for(var i = 0; i < stylesNames.length; i++) {
            settingsDialog.styleDropDownGroup.dropDown.add('item', stylesNames[i]);
        }
        settingsDialog.styleDropDownGroup.dropDown.selection = selection;
        settingsDialog.styleDropDownGroup.visible = true;
    }

    displayPublications(settingsDialog) {
        this.publications = this.getPublications(this.settings.apiKey);
        if(this.publications.length === 0) {
            throw new Error('Error\n You have no Publications in your Canvasflow account. Please create a publication and try again.');
        }

        var selectedPublication = this.publications[0];
        if(!!this.settings.PublicationID) {
            selectedPublication = this.getItemByID(this.publications, this.settings.PublicationID);
            if(selectedPublication === null) {
                alert('Warning \nThe currently selected Publication no longer exists in your Canvasflow account. The first Publication in the account has been automatically chosen.');
                selectedPublication = this.publications[0];
                this.settings.PublicationID = selectedPublication.id;
                this.settings.IssueID = '';
                this.settings.StyleID = '';
                this.canvasflowSettings.save(this.settings);
            }
        }

        this.settings.PublicationID = selectedPublication.id;

        var publicationsNames = this.mapItemsName(this.publications);
        settingsDialog.publicationDropDownGroup.dropDown.removeAll()
        for(var i = 0; i < publicationsNames.length; i++) {
            settingsDialog.publicationDropDownGroup.dropDown.add('item', publicationsNames[i]);
        }
        settingsDialog.publicationDropDownGroup.dropDown.selection = this.getItemIndexByID(this.publications, selectedPublication.id);
        settingsDialog.publicationDropDownGroup.visible = true;
        
        this.publicationType = 'article';
        if(selectedPublication.type === 'issue') {
            this.publicationType = 'issue';
            this.displayIssues(settingsDialog, this.settings.PublicationID);
        }

        this.displayTemplates(settingsDialog, this.settings.PublicationID);
        this.displayStyles(settingsDialog, this.settings.PublicationID);
    }

    displayArticleCreationMode(settingsDialog) {
        settingsDialog.creationModeDropDownGroup.visible = true;
        var selection = 0;
        var creationMode = 'document';
        if(this.settings.creationMode === 'page') {
            creationMode = 'page';
            selection = 1;
        }

        this.settings.creationMode = creationMode;

        settingsDialog.creationModeDropDownGroup.dropDown.selection = selection;
    }

    displayArticleContentOrder(settingsDialog) {
        settingsDialog.contentOrderDropDownGroup.visible = true;
        var selection = 0;
        var contentOrder = 'natural';
        if(this.settings.contentOrder === 'textFirst') {
            contentOrder = 'textFirst';
            selection = 1;
        }

        this.settings.contentOrder = contentOrder;

        settingsDialog.contentOrderDropDownGroup.dropDown.selection = selection;
    }

    hideAll(settingsDialog) {
        this.settings.PublicationID = '';
        this.settings.IssueID = '';
        this.settings.StyleID = '';

        settingsDialog.publicationDropDownGroup.visible = false;
        settingsDialog.issueDropDownGroup.visible = false;
        settingsDialog.creationModeDropDownGroup.visible = false;
        settingsDialog.styleDropDownGroup.visible = false;
        settingsDialog.pagesGroup.visible = false;
    }

    createDropDownList(dropDownGroup, items?) {
        return dropDownGroup.add('dropdownlist', this.defaultValueDim, undefined, {items: !!items ? items : []});
    }

    renderWindow() {
        var valuesWidth = this.valuesWidth;
        var defaultLabelDim = this.defaultLabelDim;
        var defaultValueDim = this.defaultValueDim;

        // ENDPOINTS
        this.settingsDialog.endpointDropDownGroup = this.settingsDialog.add('group', undefined, 'endpoint');
        this.settingsDialog.endpointDropDownGroup.orientation = 'row';
        this.settingsDialog.endpointDropDownGroup.add('statictext', defaultLabelDim, 'Endpoint');
        this.settingsDialog.endpointDropDownGroup.dropDown = this.createDropDownList(this.settingsDialog.endpointDropDownGroup, this.mapItemsName(this.endpoints));
        
        var selectedEndpoint = this.endpoints[0];
        if(!this.isInternal) { 
            this.settingsDialog.endpointDropDownGroup.visible = false;
            this.settings.endpoint = selectedEndpoint.id;   
        } else {
            this.settingsDialog.endpointDropDownGroup.visible = true;
            if(!!this.settings.endpoint) {
                selectedEndpoint = this.getItemByID(this.endpoints, this.settings.endpoint);
            }

            this.settingsDialog.endpointDropDownGroup.dropDown.selection = this.getItemIndexByID(this.endpoints, selectedEndpoint.id);
            this.settingsDialog.endpointDropDownGroup.dropDown.onChange = () => {
                this.settings.endpoint = this.endpoints[this.settingsDialog.endpointDropDownGroup.dropDown.selection.index].id;
                this.onEndpointChange(this.settingsDialog);
            }
        }

        this.canvasflowApi = new CanvasflowApi('http://' + selectedEndpoint.id + '/v2');
        if(this.canvasflowApi.getHealth() === null) {
            throw new Error('Error: \nThe Canvasflow service is not accessible. Please check your internet connection and try again.');
        }

        // API KEY
        this.settingsDialog.apiKeyGroup = this.settingsDialog.add('group');
        this.settingsDialog.apiKeyGroup.orientation = 'row';
        this.settingsDialog.apiKeyGroup.add('statictext', defaultLabelDim, 'API Key');
        this.settingsDialog.apiKeyGroup.apiKey = this.settingsDialog.apiKeyGroup.add('edittext', [0, 0, valuesWidth * 0.72, 20], '');
        this.settingsDialog.apiKeyGroup.testApiKeyBtn = this.settingsDialog.apiKeyGroup.add('button', [0, 0, valuesWidth * 0.25, 20], '&Validate');
        this.settingsDialog.apiKeyGroup.testApiKeyBtn.helpTip = 'Check if the api key is valid and loads the defaults values for the account';
        this.settingsDialog.apiKeyGroup.testApiKeyBtn.shortcutKey = 'v';
        this.settingsDialog.apiKeyGroup.testApiKeyBtn.onClick = () => {
            this.hideAll(this.settingsDialog);
            var apiKey = this.settingsDialog.apiKeyGroup.apiKey.text.replace(/\s/g,'');
            this.settingsDialog.apiKeyGroup.apiKey.text = apiKey;

            this.isValidApiKey = this.validateApiKey(this.canvasflowApi, apiKey);
            if(!this.isValidApiKey) {
                this.settingsDialog.buttonsBarGroup.saveBtn.visible = false;
                this.hidePublication(this.settingsDialog);
                alert('The API key entered is not valid. Please check and try again.');
                return;
            }

            try {
                this.settings.apiKey = apiKey;
                this.displayPublications(this.settingsDialog);
                this.displayArticleCreationMode(this.settingsDialog);
                this.displayArticleContentOrder(this.settingsDialog);
                this.settingsDialog.pagesGroup.visible = true;
                this.settingsDialog.buttonsBarGroup.saveBtn.visible = true;
            } catch(e) {
                logger.logError(e);
            }
        }
        this.settingsDialog.apiKeyGroup.visible = true;
        if(!!this.settings.apiKey) {
            this.settingsDialog.apiKeyGroup.apiKey.text = this.settings.apiKey;
            this.isValidApiKey = this.validateApiKey(this.canvasflowApi, this.settings.apiKey)
            if(!this.isValidApiKey) {
                alert('The API key entered is not valid. Please check and try again.');
            }
        }
        this.settingsDialog.apiKeyGroup.apiKey.onChanging = () => {
            this.settingsDialog.buttonsBarGroup.saveBtn.visible = false;
            this.hideAll(this.settingsDialog);
        }

        // PUBLICATION
        this.settingsDialog.publicationDropDownGroup = this.settingsDialog.add('group', undefined, 'publications');
        this.settingsDialog.publicationDropDownGroup.orientation = 'row';
        this.settingsDialog.publicationDropDownGroup.add('statictext', defaultLabelDim, 'Publication');
        this.settingsDialog.publicationDropDownGroup.dropDown = this.createDropDownList(this.settingsDialog.publicationDropDownGroup);
        this.settingsDialog.publicationDropDownGroup.visible = false;
        this.settingsDialog.publicationDropDownGroup.dropDown.onChange = () => {
            var selectedPublication = this.publications[this.settingsDialog.publicationDropDownGroup.dropDown.selection.index];
            if(!!this.settings.PublicationID) {
                if(this.settings.PublicationID != selectedPublication.id) {
                    this.settings.PublicationID = selectedPublication.id;
                    this.onPublicationChange(this.settingsDialog, selectedPublication);
                }
            } else {
                this.settings.PublicationID = selectedPublication.id;
                this.onPublicationChange(this.settingsDialog, selectedPublication);
            }
        }

        // ISSUES
        this.settingsDialog.issueDropDownGroup = this.settingsDialog.add('group', undefined, 'issues');
        this.settingsDialog.issueDropDownGroup.orientation = 'row';
        this.settingsDialog.issueDropDownGroup.add('statictext', defaultLabelDim, 'Issue');
        this.settingsDialog.issueDropDownGroup.dropDown = this.createDropDownList(this.settingsDialog.issueDropDownGroup);
        this.settingsDialog.issueDropDownGroup.visible = false;
        this.settingsDialog.issueDropDownGroup.dropDown.onChange = () => {
            this.settings.IssueID = this.issues[this.settingsDialog.issueDropDownGroup.dropDown.selection.index].id;
        }

        // CREATION MODE
        var creationModeOptions = ['Document', 'Page'];
        this.settingsDialog.creationModeDropDownGroup = this.settingsDialog.add('group', undefined, 'creationMode');
        this.settingsDialog.creationModeDropDownGroup.orientation = 'row';
        this.settingsDialog.creationModeDropDownGroup.add('statictext', defaultLabelDim, 'Article Creation');
        this.settingsDialog.creationModeDropDownGroup.dropDown = this.createDropDownList(this.settingsDialog.creationModeDropDownGroup, creationModeOptions);
        this.settingsDialog.creationModeDropDownGroup.visible = false;
        this.settingsDialog.creationModeDropDownGroup.dropDown.onChange = () => {
            if(this.settingsDialog.creationModeDropDownGroup.dropDown.selection.index === 0) {
                this.settings.creationMode = 'document';
            } else {
                this.settings.creationMode = 'page';
            }
        }

        // Add Article Content Order
        // var contentOrderOptions = ['Natural', 'Separate Images'];
        var contentOrderOptions = ['Natural'];
        this.settingsDialog.contentOrderDropDownGroup = this.settingsDialog.add('group', undefined, 'contentOrder');
        this.settingsDialog.contentOrderDropDownGroup.orientation = 'row';
        this.settingsDialog.contentOrderDropDownGroup.add('statictext', defaultLabelDim, 'Content Ordering');
        this.settingsDialog.contentOrderDropDownGroup.dropDown = this.createDropDownList(this.settingsDialog.contentOrderDropDownGroup, contentOrderOptions);
        this.settingsDialog.contentOrderDropDownGroup.visible = false;
        this.settingsDialog.contentOrderDropDownGroup.dropDown.onChange = () => {
            if(this.settingsDialog.contentOrderDropDownGroup.dropDown.selection.index === 0) {
                this.settings.contentOrder = 'natural';
            } else {
                this.settings.contentOrder = 'textFirst';
            }
        }

        // TEMPLATES
        this.settingsDialog.templateDropDownGroup = this.settingsDialog.add('group', undefined, 'templates');
        this.settingsDialog.templateDropDownGroup.orientation = 'row';
        this.settingsDialog.templateDropDownGroup.add('statictext', defaultLabelDim, 'Template');
        this.settingsDialog.templateDropDownGroup.dropDown = this.createDropDownList(this.settingsDialog.templateDropDownGroup);
        this.settingsDialog.templateDropDownGroup.visible = false;
        this.settingsDialog.templateDropDownGroup.dropDown.onChange = () => {
            this.settings.TemplateID = '' + this.templates[this.settingsDialog.templateDropDownGroup.dropDown.selection.index].id;
            this.onTemplateChange();
        }

        // STYLES
        this.settingsDialog.styleDropDownGroup = this.settingsDialog.add('group', undefined, 'styles');
        this.settingsDialog.styleDropDownGroup.orientation = 'row';
        this.settingsDialog.styleDropDownGroup.add('statictext', defaultLabelDim, 'Style');
        this.settingsDialog.styleDropDownGroup.dropDown = this.createDropDownList(this.settingsDialog.styleDropDownGroup);
        this.settingsDialog.styleDropDownGroup.visible = false;
        this.settingsDialog.styleDropDownGroup.dropDown.onChange = () => {
            this.settings.StyleID = '' + this.styles[this.settingsDialog.styleDropDownGroup.dropDown.selection.index].id;
        }

        // PAGES
        this.settingsDialog.pagesGroup = this.settingsDialog.add('group');
        this.settingsDialog.pagesGroup.orientation = 'row';
        this.settingsDialog.pagesGroup.add('statictext', defaultLabelDim, 'Publish Pages');
        this.settingsDialog.pagesGroup.pages = this.settingsDialog.pagesGroup.add('edittext', defaultValueDim, '');
        this.settingsDialog.pagesGroup.visible = false;
        if(!!this.settings.pages) {
            this.settingsDialog.pagesGroup.pages.text = this.settings.pages;
        }

        if(!!this.isValidApiKey) {
            this.displayPublications(this.settingsDialog);
            this.displayArticleCreationMode(this.settingsDialog);
            this.displayArticleContentOrder(this.settingsDialog);
            this.settingsDialog.pagesGroup.visible = true;
        }

        // Panel buttons
        this.settingsDialog.buttonsBarGroup = this.settingsDialog.add('group', undefined, 'buttons');
        this.settingsDialog.buttonsBarGroup.orientation = 'row';
        this.settingsDialog.buttonsBarGroup.alignChildren = 'bottom';    
        this.settingsDialog.buttonsBarGroup.cancelBtn = this.settingsDialog.buttonsBarGroup.add('button', undefined, 'Cancel');
        this.settingsDialog.buttonsBarGroup.saveBtn = this.settingsDialog.buttonsBarGroup.add('button', undefined, 'Save');
        this.settingsDialog.buttonsBarGroup.saveBtn.visible = false;
        if(!!this.isValidApiKey) {
            this.settingsDialog.buttonsBarGroup.saveBtn.visible = true;
        }
        
        this.settingsDialog.buttonsBarGroup.saveBtn.onClick = () => {
            try {
                this.settings.apiKey = this.settingsDialog.apiKeyGroup.apiKey.text;
                this.settings.endpoint = this.endpoints[0].id;
                if(!!this.isInternal) { 
                    this.settings.endpoint = this.endpoints[this.settingsDialog.endpointDropDownGroup.dropDown.selection.index].id; 
                }
    
                var pages = this.settingsDialog.pagesGroup.pages.text;
                
                if(!!pages.length) {
                    if(!this.isValidPagesSyntax(pages)) {
                        return;
                    }
                }
    
                this.settings.pages = pages;
    
                if(this.publicationType === 'issue' && !this.settings.IssueID) {
                    alert('This Publication has no Issues. Please create an Issue and try again.');
                    return
                }
                
                this.canvasflowSettings.save(this.settings);
                this.settingsDialog.close();
            }catch(e) {
                alert(`Error line: ${e.line} \n Message: ${e.message}`);
    
                this.logger.logError(e);
            }
        };
        
        this.settingsDialog.buttonsBarGroup.cancelBtn.onClick = () => {
            this.settingsDialog.close();
        }
        this.settingsDialog.show();
    };

    

    show() {
        this.settingsDialog.orientation = 'column';
        this.settingsDialog.alignment = 'right';
        this.settingsDialog.preferredSize = this.defaultDialogSize;
        this.renderWindow()
    };
}