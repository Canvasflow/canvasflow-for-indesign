class SettingsDialog {
	private canvasflowSettings: Settings;
	private settingsDialog: any;
	private isInternal: boolean;
	private defaultDialogSize: Array<number>;
	private canvasflowApi: CanvasflowApi;
	private isValidApiKey: boolean;
	private settings: any;
	private valuesWidth: number;
	private defaultLabelDim: Array<number>;
	private defaultValueDim: Array<number>;

	private publications: Array<any>;
	private issues: Array<any>;
	private styles: Array<any>;

	private templateDefault: any;
	private templates: Array<any>;
	private selectedTemplate: any;

	private publicationType: string;
	private endpoints: Array<any>;

	private logger: Logger;
	private document: Document;

	public creationModeOptions: Array<string>;
	public creationModeOptionsValues: Array<string>;

	constructor(canvasflowSettingsPath: string, internal: boolean, logger: Logger) {
		this.canvasflowSettings = new Settings(canvasflowSettingsPath);

		// @ts-ignore
		this.settingsDialog = new Window('dialog', 'Canvasflow Settings');

		this.isInternal = internal;
		this.defaultDialogSize = [300, 100];
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
		};
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

		this.creationModeOptions = ['Template', 'Document', 'Page'];
		// @ts-ignore
		this.creationModeOptionsValues = this.creationModeOptions.map((option: string) => option.toLowerCase());
	}

	validateApiKey(canvasflowApi, apiKey) {
		let response = canvasflowApi.validate(apiKey);
		if (response.isValid) {
			return true;
		} else {
			return false;
		}
	}

	getPublications = (apiKey: string) => this.canvasflowApi.getPublications(apiKey).filter((item :any) => !!item.id);

	getIssues = (apiKey: string, PublicationID: any) => this.canvasflowApi.getIssues(apiKey, PublicationID).filter((item :any) => !!item.id);

	getStyles = (apiKey: string, PublicationID: any) => this.canvasflowApi.getStyles(apiKey, PublicationID).filter((item :any) => !!item.id);

	getTemplates = (apiKey: string, PublicationID: any) => this.canvasflowApi.getTemplates(apiKey, PublicationID).filter((item :any) => !!item.id);

	getItemIndexByID(items: Array<any>, id: any) {
		for (let i = 0; i < items.length; i++) {
			if (items[i].id == id) {
				return i;
			}
		}
		return null;
	}

	hideTemplateOption(dialog: any) {
		dialog.templateDropDownGroup.visible = false;
	}

	showTemplateOption(dialog: any) {
		dialog.templateDropDownGroup.visible = true;
	}


	getItemByID(items: any, id: any) {
		let matches = items.filter((item: any) => item.id == id);
		return !!matches.length ? matches[0] : null;
	}

	mapItemsName(items: Array<any>) {
		let response = [];
		for (let i = 0; i < items.length; i++) {
			response.push(items[i].name);
		}
		return response;
	}

	isValidPagesRangeSyntax(input: any) {
		const results = /^([0-9]+)(-)+([0-9]+)$/.exec(input);
		const lowerRange = parseInt(results[1]);
		const higherRange = parseInt(results[3]);
		const totalOfPages = this.document.pages.length;

		if (!lowerRange) {
			alert('The lower range should be bigger than 0');
			return false;
		}

		if (!higherRange) {
			alert('The higher range should be bigger than 0');
			return false;
		}

		if (lowerRange > higherRange) {
			alert('The lower range should be smaller than the higher range');
			return false;
		}

		if (lowerRange > totalOfPages) {
			alert(`The lower range "${lowerRange}" should be smaller than the total of pages "${totalOfPages}"`);
			return false;
		}

		return true;
	}

	isValidPagesSyntax(input: any) {
		return /^[0-9]+(?:(?:\s*,\s*|-)[0-9]+)*$/.test(input);
	}

	hidePublication(settingsDialog: any) {
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

	onPublicationChange(settingsDialog: any, selectedPublication: any) {
		let PublicationID = selectedPublication.id;
		this.settings.IssueID = '';
		this.settings.StyleID = '';
		if (selectedPublication.type === 'issue') {
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

	onEndpointChange(settingsDialog: any) {
		try {
			this.settings.apiKey = '';
			this.hidePublication(settingsDialog);
			settingsDialog.apiKeyGroup.apiKey.text = '';

			let endpointIndex =
				settingsDialog.endpointDropDownGroup.dropDown.selection.index;
			this.settings.endpoint = this.endpoints[endpointIndex].id;
			this.canvasflowApi = new CanvasflowApi(`http://${this.settings.endpoint}/v2`);
			settingsDialog.buttonsBarGroup.saveBtn.visible = false;
		} catch (e) {
			this.logger.logError(e);
		}
	}

	onApiChange() {
		if (!!this.settingsDialog.apiKeyGroup.apiKey.text) {
			this.settingsDialog.buttonsBarGroup.saveBtn.enabled = true;
		} else {
			this.settingsDialog.buttonsBarGroup.saveBtn.enabled = false;
		}
	}

	onTemplateChange() {
		let selectedTemplate = this.templates[0];
		if (this.settings.TemplateID != '-1') {
			selectedTemplate = this.getItemByID(
				this.templates,
				this.settings.TemplateID
			);
			if (selectedTemplate === null) {
				selectedTemplate = this.templates[0];
			}
		}
		this.selectedTemplate = selectedTemplate;
		this.displayStyles(this.settingsDialog, this.settings.PublicationID);
	}

	displayIssues(settingsDialog: any, PublicationID: any) {
		let issues = [];
		this.issues = this.getIssues(this.settings.apiKey, PublicationID);
		for(let issue of this.issues) {
			if (!!issue.id) {
				issues.push(issue);
			}
		}
		this.issues = issues;

		if (this.issues.length === 0) {
			alert('This Publication has no Issues. Please create an Issue and try again.');
			this.settings.IssueID = '';
			return;
		}

		let selection = 0;
		let selectedIssue = this.issues[0];
		if (!!this.settings.IssueID) {
			selectedIssue = this.getItemByID(this.issues, this.settings.IssueID);
			if (selectedIssue === null) {
				alert('The currently selected Issue does not exist. \nThe first Issue in the current Publication has been selected. Please click Save to update the change.');
				this.settings.IssueID = '';
				this.displayIssues(settingsDialog, PublicationID);
				return;
			} else {
				selection = this.getItemIndexByID(this.issues, selectedIssue.id);
			}
		}

		this.settings.IssueID = selectedIssue.id;
		let issuesNames = this.mapItemsName(this.issues);

		settingsDialog.issueDropDownGroup.dropDown.removeAll();
		for (let i = 0; i < issuesNames.length; i++) {
			settingsDialog.issueDropDownGroup.dropDown.add('item', issuesNames[i]);
		}
		settingsDialog.issueDropDownGroup.dropDown.selection = selection;
		settingsDialog.issueDropDownGroup.visible = true;
	}

	displayTemplates(settingsDialog: any, PublicationID: any) {
		this.templates = [this.templateDefault].concat(this.getTemplates(this.settings.apiKey, PublicationID));

		let selectedTemplate = this.templates[0];
		let selection = 0;
		if (this.settings.TemplateID != '-1') {
			selectedTemplate = this.getItemByID(
				this.templates,
				this.settings.TemplateID
			);
			if (selectedTemplate === null) {
				selection = 0;
				selectedTemplate = this.templates[0];
			} else {
				selection = this.getItemIndexByID(this.templates, selectedTemplate.id);
			}
		}

		this.selectedTemplate = selectedTemplate;

		this.settings.TemplateID = `${selectedTemplate.id}`;
		let templatesNames = this.mapItemsName(this.templates);

		settingsDialog.templateDropDownGroup.dropDown.removeAll();
		for(let templateName of templatesNames) {
			settingsDialog.templateDropDownGroup.dropDown.add('item', templateName);
		}
		settingsDialog.templateDropDownGroup.dropDown.selection = selection;
		settingsDialog.templateDropDownGroup.visible = true;
		if(this.settings.creationMode !== 'template') {
			this.hideTemplateOption(settingsDialog);
		}
	}

	displayStyles(settingsDialog: any, PublicationID: any) {
		if (this.selectedTemplate.id != '-1') {
			this.settings.StyleID = `${this.selectedTemplate.StyleID}`;
			settingsDialog.styleDropDownGroup.enabled = false;
		} else {
			settingsDialog.styleDropDownGroup.enabled = true;
		}

		this.styles = this.getStyles(this.settings.apiKey, PublicationID);

		if (this.styles.length === 0) {
			alert('This Publication has no Styles. Please create an Style and try again.');
			return;
		}

		let selectedStyle = this.styles[0];
		let selection = 0;
		if (!!this.settings.StyleID) {
			selectedStyle = this.getItemByID(this.styles, this.settings.StyleID);
			if (selectedStyle === null) {
				alert('The currently selected Style does not exist. \nThe first Style in the current Publication has been selected. Please click Save to update the change.');
				selection = 0;
				selectedStyle = this.styles[0];
			} else {
				selection = this.getItemIndexByID(this.styles, selectedStyle.id);
			}
		}

		this.settings.StyleID = `${selectedStyle.id}`;
		let stylesNames = this.mapItemsName(this.styles);

		settingsDialog.styleDropDownGroup.dropDown.removeAll();
		for(let styleName of stylesNames) {
			settingsDialog.styleDropDownGroup.dropDown.add('item', styleName);
		}
		settingsDialog.styleDropDownGroup.dropDown.selection = selection;
		settingsDialog.styleDropDownGroup.visible = true;
	}

	displayPublications(settingsDialog: any) {
		this.publications = this.getPublications(this.settings.apiKey);
		if (this.publications.length === 0) {
			throw new Error('Error\n You have no Publications in your Canvasflow account. Please create a publication and try again.');
		}

		let selectedPublication = this.publications[0];
		if (!!this.settings.PublicationID) {
			selectedPublication = this.getItemByID(
				this.publications,
				this.settings.PublicationID
			);
			if (selectedPublication === null) {
				alert('Warning \nThe currently selected Publication no longer exists in your Canvasflow account. The first Publication in the account has been automatically chosen.');
				selectedPublication = this.publications[0];
				this.settings.PublicationID = selectedPublication.id;
				this.settings.IssueID = '';
				this.settings.StyleID = '';
				this.canvasflowSettings.save(this.settings);
			}
		}

		this.settings.PublicationID = selectedPublication.id;

		let publicationsNames = this.mapItemsName(this.publications);
		settingsDialog.publicationDropDownGroup.dropDown.removeAll();
		for(let publicationName of publicationsNames) {
			settingsDialog.publicationDropDownGroup.dropDown.add('item', publicationName);
		}
		settingsDialog.publicationDropDownGroup.dropDown.selection = this.getItemIndexByID(
			this.publications,
			selectedPublication.id
		);
		settingsDialog.publicationDropDownGroup.visible = true;

		this.publicationType = 'article';
		if (selectedPublication.type === 'issue') {
			this.publicationType = 'issue';
			this.displayIssues(settingsDialog, this.settings.PublicationID);
		}

		this.displayTemplates(settingsDialog, this.settings.PublicationID);
		this.displayStyles(settingsDialog, this.settings.PublicationID);
	}

	displayArticleCreationMode(settingsDialog: any) {
		settingsDialog.creationModeDropDownGroup.visible = true;
		
		// @ts-ignore
		let selection = this.creationModeOptionsValues.indexOf(this.settings.creationMode);

		settingsDialog.creationModeDropDownGroup.dropDown.selection = selection;
	}

	displayArticleContentOrder(settingsDialog: any) {
		settingsDialog.contentOrderDropDownGroup.visible = true;
		let selection = 0;
		let contentOrder = 'natural';
		if (this.settings.contentOrder === 'textFirst') {
			contentOrder = 'textFirst';
			selection = 1;
		}

		this.settings.contentOrder = contentOrder;

		settingsDialog.contentOrderDropDownGroup.dropDown.selection = selection;
	}

	hideAll(settingsDialog: any) {
		this.settings.PublicationID = '';
		this.settings.IssueID = '';
		this.settings.StyleID = '';

		settingsDialog.publicationDropDownGroup.visible = false;
		settingsDialog.issueDropDownGroup.visible = false;
		settingsDialog.creationModeDropDownGroup.visible = false;
		settingsDialog.styleDropDownGroup.visible = false;
		settingsDialog.pagesGroup.visible = false;
	}

	createDropDownList(dropDownGroup: any, items?: any) {
		return dropDownGroup.add('dropdownlist', this.defaultValueDim, undefined, {
			items: !!items ? items : []
		});
	}

	renderWindow() {
		let valuesWidth = this.valuesWidth;
		let defaultLabelDim = this.defaultLabelDim;
		let defaultValueDim = this.defaultValueDim;

		// ENDPOINTS
		this.settingsDialog.endpointDropDownGroup = this.settingsDialog.add(
			'group',
			undefined,
			'endpoint'
		);
		this.settingsDialog.endpointDropDownGroup.orientation = 'row';
		this.settingsDialog.endpointDropDownGroup.add(
			'statictext',
			defaultLabelDim,
			'Endpoint'
		);
		this.settingsDialog.endpointDropDownGroup.dropDown = this.createDropDownList(
			this.settingsDialog.endpointDropDownGroup,
			this.mapItemsName(this.endpoints)
		);

		let selectedEndpoint = this.endpoints[0];
		if (!this.isInternal) {
			this.settingsDialog.endpointDropDownGroup.visible = false;
			this.settings.endpoint = selectedEndpoint.id;
		} else {
			this.settingsDialog.endpointDropDownGroup.visible = true;
			if (!!this.settings.endpoint) {
				selectedEndpoint = this.getItemByID(
					this.endpoints,
					this.settings.endpoint
				);
			}

			this.settingsDialog.endpointDropDownGroup.dropDown.selection = this.getItemIndexByID(
				this.endpoints,
				selectedEndpoint.id
			);
			this.settingsDialog.endpointDropDownGroup.dropDown.onChange = () => {
				this.settings.endpoint = this.endpoints[this.settingsDialog.endpointDropDownGroup.dropDown.selection.index].id;
				this.onEndpointChange(this.settingsDialog);
			};
		}

		this.canvasflowApi = new CanvasflowApi(`http://${selectedEndpoint.id}/v2`);
		if (this.canvasflowApi.getHealth() === null) {
			throw new Error('Error \nThe Canvasflow service is not accessible. Please check your internet connection and try again.');
		}

		// API KEY
		this.settingsDialog.apiKeyGroup = this.settingsDialog.add('group');
		this.settingsDialog.apiKeyGroup.orientation = 'row';
		this.settingsDialog.apiKeyGroup.add(
			'statictext',
			defaultLabelDim,
			'API Key'
		);
		this.settingsDialog.apiKeyGroup.apiKey = this.settingsDialog.apiKeyGroup.add(
			'edittext',
			[0, 0, valuesWidth * 0.72, 20],
			''
		);
		this.settingsDialog.apiKeyGroup.testApiKeyBtn = this.settingsDialog.apiKeyGroup.add(
			'button',
			[0, 0, valuesWidth * 0.25, 20],
			'&Validate'
		);
		this.settingsDialog.apiKeyGroup.testApiKeyBtn.helpTip ='Check if the api key is valid and loads the defaults values for the account';
		this.settingsDialog.apiKeyGroup.testApiKeyBtn.shortcutKey = 'v';
		this.settingsDialog.apiKeyGroup.testApiKeyBtn.onClick = () => {
			this.hideAll(this.settingsDialog);
			let apiKey = this.settingsDialog.apiKeyGroup.apiKey.text.replace(
				/\s/g,
				''
			);
			this.settingsDialog.apiKeyGroup.apiKey.text = apiKey;

			this.isValidApiKey = this.validateApiKey(this.canvasflowApi, apiKey);
			if (!this.isValidApiKey) {
				this.settingsDialog.buttonsBarGroup.saveBtn.visible = false;
				this.hidePublication(this.settingsDialog);
				alert('Error \nThe API key entered is not valid. Please check and try again.');
				return;
			}

			try {
				this.settings.apiKey = apiKey;
				this.displayPublications(this.settingsDialog);
				this.displayArticleCreationMode(this.settingsDialog);
				this.displayArticleContentOrder(this.settingsDialog);
				this.settingsDialog.pagesGroup.visible = true;
				this.settingsDialog.buttonsBarGroup.saveBtn.visible = true;
			} catch (e) {
				this.logger.logError(e);
			}
		};
		this.settingsDialog.apiKeyGroup.visible = true;
		if (!!this.settings.apiKey) {
			this.settingsDialog.apiKeyGroup.apiKey.text = this.settings.apiKey;
			this.isValidApiKey = this.validateApiKey(
				this.canvasflowApi,
				this.settings.apiKey
			);
			if (!this.isValidApiKey) {
				alert('Error \nThe API key entered is not valid. Please check and try again.');
			}
		}
		this.settingsDialog.apiKeyGroup.apiKey.onChanging = () => {
			this.settingsDialog.buttonsBarGroup.saveBtn.visible = false;
			this.hideAll(this.settingsDialog);
		};

		// PUBLICATION
		this.settingsDialog.publicationDropDownGroup = this.settingsDialog.add(
			'group',
			undefined,
			'publications'
		);
		this.settingsDialog.publicationDropDownGroup.orientation = 'row';
		this.settingsDialog.publicationDropDownGroup.add(
			'statictext',
			defaultLabelDim,
			'Publication'
		);
		this.settingsDialog.publicationDropDownGroup.dropDown = this.createDropDownList(
			this.settingsDialog.publicationDropDownGroup
		);
		this.settingsDialog.publicationDropDownGroup.visible = false;
		this.settingsDialog.publicationDropDownGroup.dropDown.onChange = () => {
			let selectedPublication = this.publications[
				this.settingsDialog.publicationDropDownGroup.dropDown.selection.index
			];
			if (!!this.settings.PublicationID) {
				if (this.settings.PublicationID != selectedPublication.id) {
					this.settings.PublicationID = selectedPublication.id;
					this.onPublicationChange(this.settingsDialog, selectedPublication);
				}
			} else {
				this.settings.PublicationID = selectedPublication.id;
				this.onPublicationChange(this.settingsDialog, selectedPublication);
			}
		};

		// ISSUES
		this.settingsDialog.issueDropDownGroup = this.settingsDialog.add(
			'group',
			undefined,
			'issues'
		);
		this.settingsDialog.issueDropDownGroup.orientation = 'row';
		this.settingsDialog.issueDropDownGroup.add(
			'statictext',
			defaultLabelDim,
			'Issue'
		);
		this.settingsDialog.issueDropDownGroup.dropDown = this.createDropDownList(
			this.settingsDialog.issueDropDownGroup
		);
		this.settingsDialog.issueDropDownGroup.visible = false;
		this.settingsDialog.issueDropDownGroup.dropDown.onChange = () => {
			this.settings.IssueID = this.issues[this.settingsDialog.issueDropDownGroup.dropDown.selection.index].id;
		};

		// CREATION MODE
		let creationModeOptions = this.creationModeOptions;
		this.settingsDialog.creationModeDropDownGroup = this.settingsDialog.add(
			'group',
			undefined,
			'creationMode'
		);
		this.settingsDialog.creationModeDropDownGroup.orientation = 'row';
		this.settingsDialog.creationModeDropDownGroup.add(
			'statictext',
			defaultLabelDim,
			'Article Creation'
		);
		this.settingsDialog.creationModeDropDownGroup.dropDown = this.createDropDownList(
			this.settingsDialog.creationModeDropDownGroup,
			creationModeOptions
		);
		this.settingsDialog.creationModeDropDownGroup.visible = false;
		this.settingsDialog.creationModeDropDownGroup.dropDown.onChange = () => {
			this.settings.creationMode = this.creationModeOptionsValues[this.settingsDialog.creationModeDropDownGroup.dropDown.selection.index];
			if(this.settings.creationMode === 'template') {
				this.showTemplateOption(this.settingsDialog);
			} else {
				this.hideTemplateOption(this.settingsDialog)
			}
		};

		// Add Article Content Order
		// var contentOrderOptions = ['Natural', 'Separate Images'];
		let contentOrderOptions = ['Natural'];
		this.settingsDialog.contentOrderDropDownGroup = this.settingsDialog.add(
			'group',
			undefined,
			'contentOrder'
		);
		this.settingsDialog.contentOrderDropDownGroup.orientation = 'row';
		this.settingsDialog.contentOrderDropDownGroup.add(
			'statictext',
			defaultLabelDim,
			'Content Ordering'
		);
		this.settingsDialog.contentOrderDropDownGroup.dropDown = this.createDropDownList(
			this.settingsDialog.contentOrderDropDownGroup,
			contentOrderOptions
		);
		this.settingsDialog.contentOrderDropDownGroup.visible = false;
		this.settingsDialog.contentOrderDropDownGroup.dropDown.onChange = () => {
			if (this.settingsDialog.contentOrderDropDownGroup.dropDown.selection.index === 0) {
				this.settings.contentOrder = 'natural';
			} else {
				this.settings.contentOrder = 'textFirst';
			}
		};

		// TEMPLATES
		this.settingsDialog.templateDropDownGroup = this.settingsDialog.add(
			'group',
			undefined,
			'templates'
		);
		this.settingsDialog.templateDropDownGroup.orientation = 'row';
		this.settingsDialog.templateDropDownGroup.add(
			'statictext',
			defaultLabelDim,
			'Template'
		);
		this.settingsDialog.templateDropDownGroup.dropDown = this.createDropDownList(
			this.settingsDialog.templateDropDownGroup
		);
		this.settingsDialog.templateDropDownGroup.visible = false;
		this.settingsDialog.templateDropDownGroup.dropDown.onChange = () => {
			this.settings.TemplateID =`${this.templates[this.settingsDialog.templateDropDownGroup.dropDown.selection.index].id}`;
			this.onTemplateChange();
		};

		if(this.settings.creationMode !== 'template') {
			this.hideTemplateOption(this.settingsDialog);
		}

		// STYLES
		this.settingsDialog.styleDropDownGroup = this.settingsDialog.add(
			'group',
			undefined,
			'styles'
		);
		this.settingsDialog.styleDropDownGroup.orientation = 'row';
		this.settingsDialog.styleDropDownGroup.add(
			'statictext',
			defaultLabelDim,
			'Style'
		);
		this.settingsDialog.styleDropDownGroup.dropDown = this.createDropDownList(
			this.settingsDialog.styleDropDownGroup
		);
		this.settingsDialog.styleDropDownGroup.visible = false;
		this.settingsDialog.styleDropDownGroup.dropDown.onChange = () => {
			this.settings.StyleID =`${this.styles[this.settingsDialog.styleDropDownGroup.dropDown.selection.index].id}`;
		};

		// PAGES
		this.settingsDialog.pagesGroup = this.settingsDialog.add('group');
		this.settingsDialog.pagesGroup.orientation = 'row';
		this.settingsDialog.pagesGroup.add(
			'statictext',
			defaultLabelDim,
			'Publish Pages'
		);
		this.settingsDialog.pagesGroup.pages = this.settingsDialog.pagesGroup.add(
			'edittext',
			defaultValueDim,
			''
		);
		this.settingsDialog.pagesGroup.visible = false;
		if (!!this.settings.pages) {
			this.settingsDialog.pagesGroup.pages.text = this.settings.pages.replace(/\s/g,'');
		}

		if (!!this.isValidApiKey) {
			this.displayPublications(this.settingsDialog);
			this.displayArticleCreationMode(this.settingsDialog);
			this.displayArticleContentOrder(this.settingsDialog);
			this.settingsDialog.pagesGroup.visible = true;
		}

		// Panel buttons
		this.settingsDialog.buttonsBarGroup = this.settingsDialog.add(
			'group',
			undefined,
			'buttons'
		);
		this.settingsDialog.buttonsBarGroup.orientation = 'row';
		this.settingsDialog.buttonsBarGroup.alignChildren = 'bottom';
		this.settingsDialog.buttonsBarGroup.cancelBtn = this.settingsDialog.buttonsBarGroup.add(
			'button',
			undefined,
			'Cancel'
		);
		this.settingsDialog.buttonsBarGroup.saveBtn = this.settingsDialog.buttonsBarGroup.add(
			'button',
			undefined,
			'Save'
		);
		this.settingsDialog.buttonsBarGroup.saveBtn.visible = false;
		if (!!this.isValidApiKey) {
			this.settingsDialog.buttonsBarGroup.saveBtn.visible = true;
		}

		this.settingsDialog.buttonsBarGroup.saveBtn.onClick = () => {
			try {
				this.settings.apiKey = this.settingsDialog.apiKeyGroup.apiKey.text;
				this.settings.endpoint = this.endpoints[0].id;
				if (!!this.isInternal) {
					this.settings.endpoint = this.endpoints[this.settingsDialog.endpointDropDownGroup.dropDown.selection.index].id;
				}

				let pages = this.settingsDialog.pagesGroup.pages.text.replace(/\s/g,'');

				if (!!pages.length) {
					if (!this.isValidPagesSyntax(pages)) {
						alert('The range for pages has an invalid syntax');
						return;
					}
				}

				this.settings.pages = pages;

				if (this.publicationType === 'issue' && !this.settings.IssueID) {
					alert('Warning \nThis Publication has no Issues. Please create an Issue and try again.');
					return;
				}

				if(this.settings.creationMode !== 'template') {
					this.settings.TemplateID = '-1';
				}

				this.canvasflowSettings.save(this.settings);
				this.settingsDialog.close();
			} catch (e) {
				this.logger.logError(e);
			}
		};

		this.settingsDialog.buttonsBarGroup.cancelBtn.onClick = () => {
			this.settingsDialog.close();
		};
		this.settingsDialog.show();
	}

	show() {
		this.settingsDialog.orientation = 'column';
		this.settingsDialog.alignment = 'right';
		this.settingsDialog.preferredSize = this.defaultDialogSize;
		this.renderWindow();
	}
}
