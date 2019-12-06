class Publisher {
	private uuid: string;
	private host: string;
	private canvasflowApi: CanvasflowApi;
	
	private builder: Builder;
	private boundary: string;
	private articleName: string;
	private valuesWidth: number;
	private styles: Array<any>;
	
	private savedSettings: any;
	private templateDefault: any;
	private templates: Array<any>;
	private selectedTemplate: any;
	private document: Document;
	private logger: Logger;

	public baseDirectory: string;
	public filePath: string;
	public defaultValueDim: Array<number>;
	public dialog: any;
	public pagesRange: any;

	constructor(canvasflowSettings: Settings, host: string, builder: Builder, canvasflowApi: CanvasflowApi, logger: Logger) {
		this.baseDirectory = '';
		this.filePath = '';
		this.uuid = '';
		this.host = host;
		this.canvasflowApi = canvasflowApi;
		this.dialog = {};
		this.pagesRange = null;
		this.builder = builder;
		this.boundary = Math.random()
			.toString()
			.substr(2);
		this.articleName = '';

		this.valuesWidth = 200;
		this.logger = logger;
		this.document = app.activeDocument;

		this.defaultValueDim = [0, 0, this.valuesWidth, 20];
		this.savedSettings = canvasflowSettings.getSavedSettings();
		this.templateDefault = {
			id: '-1',
			name: 'None',
			StyleID: ''
		};
		this.templates = [this.templateDefault];
	}

	createTextFormParam(property: string, value: string) {
		return (
			`--${this.boundary}\r\n` +
			`Content-Disposition: form-data; name="${property}"\r\n\r\n` + 
			`${value}\r\n\r\n`
		);
	}

	getTextFormParams(textProperties: any) {
		let response = [];
		for (let property in textProperties) {
			response.push(this.createTextFormParam(property, textProperties[property]));
		}
		return response;
	}

	createFileFormParam(property: string, fileName: string, fileContent: any) {
		return (
			`--${this.boundary}\r\n` +
			`Content-Disposition: form-data; name="${property}"; filename="${fileName}"\r\n` +
			'Content-Type: application/octet-stream\r\n\r\n' +
			`${fileContent}\r\n\r\n`
		);
	}

	getFileFormParams(fileProperties: any) {
		let response = [];
		for (let property in fileProperties) {
			let file = fileProperties[property];
			response.push(
				this.createFileFormParam(property, file.name, file.content)
			);
		}
		return response;
	}

	uploadZip(filepath: string) {
		let conn = new Socket();

		let reply = '';
		let host = this.host + ':80';

		let f = File(filepath);
		let filename = f.name;
		f.encoding = 'BINARY';
		f.open('r');
		let fContent = f.read();
		f.close();

		let articleName = this.articleName;

		/*alert(JSON.stringify(this.savedSettings));
        return true;*/

		const apiKey = this.savedSettings.apiKey;
		let PublicationID = this.savedSettings.PublicationID || '';
		let IssueID = this.savedSettings.IssueID || '';
		let TemplateID = this.savedSettings.TemplateID || '';
		let StyleID = this.savedSettings.StyleID || '';
		let creationMode = this.savedSettings.creationMode || 'document';
		let contentOrder = this.savedSettings.contentOrder || 'natural';

		if (conn.open(host, 'BINARY')) {
			conn.timeout = 20000;

			this.boundary = Math.random()
				.toString()
				.substr(2);

			this.uuid = this.builder.getDocumentID();

			this.logger.log('---------------------------');
			this.logger.log(`Api Key: ${apiKey}`);
			this.logger.log(`ID: ${this.uuid}`);
			this.logger.log(`PublicationID: ${PublicationID}`);
			this.logger.log(`IssueID: ${IssueID}`);
			this.logger.log(`StyleID: ${StyleID}`);
			this.logger.log(`TemplateID: ${TemplateID}`);
			this.logger.log(`Creation Mode: ${creationMode}`);
			this.logger.log(`Content Order: ${contentOrder}`);
			this.logger.log(`Article Name: ${articleName}`);
			this.logger.log('---------------------------');

			let form = {
				file: {
					contentFile: {
						name: filename,
						content: fContent
					}
				},
				text: {
					secretKey: apiKey,
					creationMode: creationMode,
					contentOrder: contentOrder,
					articleName: articleName,
					publicationId: PublicationID.trim(),
					issueId: IssueID.trim(),
					templateId: TemplateID.trim(),
					styleId: StyleID.trim(),
					contentType: 'indesign',
					articleId: this.uuid
				}
			};

			let content = this.getFileFormParams(form.file)
				.concat(this.getTextFormParams(form.text))
				.concat([`--${this.boundary}--\r\n\r`]) 
				.join('');

				

			let cs = 'POST /v1/index.cfm?endpoint=/article HTTP/1.1\r\n' +
				`Content-Length: ${content.length}\r\n` + 
				`Content-Type: multipart/form-data; boundary=${this.boundary}\r\n` + 
				`Host: ${host}\r\n` +
				`Authorization: ${apiKey}\r\n` +
				'Accept: */*\r\n\r\n' +
				content;

			conn.write(cs);

			reply = conn.read();
			conn.close();

			if (reply.indexOf('200') > 0) {
				// var data = reply.substring(reply.indexOf("{"), reply.length);
				// alert(reply);
				// var response = JSON.parse(data);
				return true;
			} else {
				alert(reply);
				return false;
			}
		} else {
			throw new Error('Error: \nThe Canvasflow service is not accessible. Please check your internet connection and try again.');
		}
	}

	getPublication() {
		let apiKey = this.savedSettings.apiKey;
		let PublicationID = this.savedSettings.PublicationID;

		let publications = this.canvasflowApi.getPublications(apiKey).filter((item :any) => !!item.id);
		if (!publications.length) {
			throw new Error('Error \nYou have no Publications in your Canvasflow account. Please create a publication and try again.');
		}
		let matches = publications.filter((publication: any) => publication.id == PublicationID);
		if (!!matches.length) {
			return matches[0];
		}

		throw new Error('Error \nThe currently selected Publication does not exist. Please open "Settings" and select a Publication.');
	}

	getIssues() {
		let apiKey = this.savedSettings.apiKey;
		let PublicationID = this.savedSettings.PublicationID;

		return this.canvasflowApi.getIssues(apiKey, PublicationID).filter((item :any) => !!item.id);
	}

	getIssue(issues: any) {
		let IssueID = this.savedSettings.IssueID;
		if (!!IssueID) {
			let matches = issues.filter((issue: any) => issue.id == IssueID);

			if (!!matches.length) {
				return matches[0];
			}
		}
		return issues[0];
	}

	getStyles() {
		let apiKey = this.savedSettings.apiKey;
		let PublicationID = this.savedSettings.PublicationID;
		return this.canvasflowApi.getStyles(apiKey, PublicationID).filter((item :any) => !!item.id);
	}

	getStyle(styles: any) {
		let StyleID = this.savedSettings.StyleID;
		if (!!StyleID) {
			let matches = styles.filter((style: any) => style.id == StyleID);

			if (!!matches.length) {
				return matches[0];
			}
		}
		return styles[0];
	}

	getTemplates() {
		let apiKey = this.savedSettings.apiKey;
		let PublicationID = this.savedSettings.PublicationID;
		return this.canvasflowApi.getTemplates(apiKey, PublicationID).filter((item :any) => !!item.id);
	}

	getTemplate(templates: any) {
		let TemplateID = this.savedSettings.TemplateID;
		if (!!TemplateID) {
			let matches = templates.filter((template: any) => template.id == TemplateID);

			if (!!matches.length) {
				return matches[0];
			}
		}
		return templates[0];
	}

	createDropDownList(dropDownGroup: any, items: any) {
		return dropDownGroup.add(
			'dropdownlist',
			[0, 0, this.valuesWidth, 20],
			undefined,
			{ items: !!items ? items : [] }
		);
	}

	getItemsName(items: Array<any>) {
		let response = [];
		for(let item of items) {
			response.push(item.name);
		}
		return response;
	}

	getSelectedIndex(items: Array<any>, id: any) {
		for (let i = 0; i < items.length; i++) {
			if (items[i].id == id) {
				return i;
			}
		}
		return 0;
	}

	isValidPagesRangeSyntax(input: any) {
		const results = /^([0-9]+)(-)+([0-9]+)$/.exec(input);
		let lowerRange = parseInt(results[1]);
		let higherRange = parseInt(results[3]);
		let totalOfPages = this.document.pages.length;

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
		if (!!/^([0-9]+)(-)+([0-9]+)$/.exec(input)) {
			return this.isValidPagesRangeSyntax(input);
		} else if (!!/^(\d)+(,\d+)*$/.exec(input)) {
			return true;
		}

		alert('The range for pages has an invalid syntax');
		return false;
	}

	displayStyles(settingsDialog: any) {
		if (this.selectedTemplate.id != '-1') {
			this.savedSettings.StyleID = `${this.selectedTemplate.StyleID}`;
			settingsDialog.styleGroup.dropDown.selection = this.getSelectedIndex(
				this.styles,
				this.savedSettings.StyleID
			);
			settingsDialog.styleGroup.enabled = false;
			return;
		}
		settingsDialog.styleGroup.enabled = true;
		this.savedSettings.StyleID = `${this.styles[settingsDialog.styleGroup.dropDown.selection.index].id}`;
	}

	onTemplateChange(dialog: any) {
		let selectedTemplate = this.templates[0];
		if (this.savedSettings.TemplateID != '-1') {
			selectedTemplate = this.templates[this.getSelectedIndex(this.templates, this.savedSettings.TemplateID)];
		}
		this.selectedTemplate = selectedTemplate;
		this.displayStyles(dialog);
	}

	displayConfirmDialog() {
		// @ts-ignore
		let dialog = new Window('dialog', 'Publish to Canvasflow', undefined, {
			closeButton: false
		});
		dialog.orientation = 'column';
		dialog.alignment = 'right';
		dialog.preferredSize = [300, 100];

		let valuesWidth = this.valuesWidth;
		let labelWidth = 150;

		let defaultLabelDim = [0, 0, labelWidth, 20];
		let defaultValueDim = [0, 0, valuesWidth, 20];

		let endpoint = this.savedSettings.endpoint;

		this.canvasflowApi = new CanvasflowApi(`http://${endpoint}/v2`);

		// Intro
		let intro =
			'You are about to publish the current document. \n\nPlease confirm details are correct:';
		dialog.introGroup = dialog.add(
			'statictext',
			[0, 0, valuesWidth * 1.5, 70],
			intro,
			{ multiline: true }
		);
		dialog.introGroup.orientation = 'row:top';
		dialog.introGroup.alignment = 'left';

		// Publication
		let publication = this.getPublication();
		dialog.publicationGroup = dialog.add('group');
		dialog.publicationGroup.orientation = 'row';
		dialog.publicationGroup.add('statictext', defaultLabelDim, 'Publication');
		let publicationNameValue = dialog.publicationGroup.add(
			'statictext',
			defaultValueDim,
			publication.name
		);
		publicationNameValue.helpTip = 'The currently connected publication.';

		// Separator
		dialog.separator = dialog.add('panel');
		dialog.separator.visible = true;
		dialog.separator.alignment = 'center';
		dialog.separator.size = [(labelWidth + valuesWidth) * 1.035, 1];
		dialog.separator.minimumSize.height = dialog.separator.maximumSize.height = 1;

		// Name
		dialog.articleNameGroup = dialog.add('group');
		dialog.articleNameGroup.orientation = 'row';
		dialog.articleNameGroup.add('statictext', defaultLabelDim, 'Name');
		dialog.articleNameGroup.articleName = dialog.articleNameGroup.add(
			'edittext',
			defaultValueDim,
			this.articleName
		);
		dialog.articleNameGroup.articleName.helpTip = 'The name of the published article. If left empty will default to the InDesign filename.';
		// dialog.articleNameGroup.pages.helpTip = '';

		// Issue
		if (publication.type === 'issue') {
			let issues = this.getIssues();
			let issue = this.getIssue(issues);
			dialog.issueGroup = dialog.add('group');
			dialog.issueGroup.orientation = 'row';
			dialog.issueGroup.add('statictext', defaultLabelDim, 'Issue');
			dialog.issueGroup.dropDown = this.createDropDownList(
				dialog.issueGroup,
				this.getItemsName(issues)
			);
			dialog.issueGroup.dropDown.selection = this.getSelectedIndex(
				issues,
				issue.id
			);
			dialog.issueGroup.dropDown.helpTip = 'The Issue the article will be published to.';
			dialog.issueGroup.dropDown.onChange = () => {
				this.savedSettings.IssueID =
					'' + issues[dialog.issueGroup.dropDown.selection.index].id;
			};
		}

		// TEMPLATES
		let templates = [this.templateDefault].concat(this.getTemplates());
		let template = this.getTemplate(templates);
		this.selectedTemplate = template;
		this.templates = templates;
		dialog.templateGroup = dialog.add('group', undefined, 'templates');
		dialog.templateGroup.orientation = 'row';
		dialog.templateGroup.add('statictext', defaultLabelDim, 'Template');
		dialog.templateGroup.dropDown = this.createDropDownList(
			dialog.templateGroup,
			this.getItemsName(templates)
		);
		dialog.templateGroup.dropDown.selection = this.getSelectedIndex(
			templates,
			template.id
		);
		dialog.templateGroup.dropDown.helpTip = 'The Template applied when published.';
		dialog.templateGroup.dropDown.onChange = () => {
			try {
				this.savedSettings.TemplateID = `${this.templates[dialog.templateGroup.dropDown.selection.index].id}`;
				this.onTemplateChange(dialog);
			} catch (e) {
				alert(e.message);
			}
		};

		// STYLEs
		let styles = this.getStyles();
		this.styles = styles;
		let style = this.getStyle(styles);
		dialog.styleGroup = dialog.add('group');
		dialog.styleGroup.orientation = 'row';
		dialog.styleGroup.add('statictext', defaultLabelDim, 'Style');
		dialog.styleGroup.dropDown = this.createDropDownList(
			dialog.styleGroup,
			this.getItemsName(styles)
		);
		dialog.styleGroup.dropDown.selection = this.getSelectedIndex(
			styles,
			style.id
		);
		dialog.styleGroup.dropDown.helpTip = 'The Style applied when published.';
		dialog.styleGroup.dropDown.onChange = () => {
			this.savedSettings.StyleID = `${styles[dialog.styleGroup.dropDown.selection.index].id}`;
		};

		// Creation Mode
		let creationModeOptions = ['Document', 'Page'];
		dialog.creationModeGroup = dialog.add('group');
		dialog.creationModeGroup.orientation = 'row';
		dialog.creationModeGroup.add(
			'statictext',
			defaultLabelDim,
			'Article Creation'
		);
		dialog.creationModeGroup.dropDown = this.createDropDownList(
			dialog.creationModeGroup,
			creationModeOptions
		);
		dialog.creationModeGroup.dropDown.helpTip = 'Whether a single or multiple articles will be created.';
		if (this.savedSettings.creationMode === 'document') {
			dialog.creationModeGroup.dropDown.selection = 0;
		} else {
			dialog.creationModeGroup.dropDown.selection = 1;
		}
		dialog.creationModeGroup.dropDown.onChange = () => {
			if (dialog.creationModeGroup.dropDown.selection.index === 0) {
				this.savedSettings.creationMode = 'document';
			} else {
				this.savedSettings.creationMode = 'page';
			}
		};

		// Article Content Order
		let contentOrderOptions = ['Natural'];
		dialog.contentOrderGroup = dialog.add('group');
		dialog.contentOrderGroup.orientation = 'row';
		dialog.contentOrderGroup.add(
			'statictext',
			defaultLabelDim,
			'Content Ordering'
		);
		dialog.contentOrderGroup.dropDown = this.createDropDownList(
			dialog.contentOrderGroup,
			contentOrderOptions
		);
		dialog.contentOrderGroup.helpTip = 'The order in which content will be processed.';
		dialog.contentOrderGroup.dropDown.selection = 0;
		dialog.contentOrderGroup.dropDown.enabled = true;
		this.savedSettings.contentOrder = 'natural';
		dialog.contentOrderGroup.dropDown.onChange = () => {
			this.savedSettings.contentOrder = 'natural';
		};

		// Pages
		dialog.pagesGroup = dialog.add('group');
		dialog.pagesGroup.orientation = 'row';
		dialog.pagesGroup.add('statictext', defaultLabelDim, 'Publish Pages');
		dialog.pagesGroup.pages = dialog.pagesGroup.add(
			'edittext',
			defaultValueDim,
			!!this.savedSettings.pages ? this.savedSettings.pages : ''
		);
		dialog.pagesGroup.pages.helpTip = 'Pages to be published. If empty, all pages are published.';

		// Separator
		dialog.separator = dialog.add('panel');
		dialog.separator.visible = true;
		dialog.separator.alignment = 'center';
		dialog.separator.size = [(labelWidth + valuesWidth) * 1.035, 1];
		dialog.separator.minimumSize.height = dialog.separator.maximumSize.height = 1;

		dialog.buttonsBarGroup = dialog.add('group');
		dialog.buttonsBarGroup.orientation = 'row';
		dialog.buttonsBarGroup.alignChildren = 'bottom';
		dialog.buttonsBarGroup.cancelBtn = dialog.buttonsBarGroup.add(
			'button',
			undefined,
			'Cancel'
		);
		dialog.buttonsBarGroup.saveBtn = dialog.buttonsBarGroup.add(
			'button',
			undefined,
			'OK'
		);

		this.displayStyles(dialog);

		dialog.buttonsBarGroup.saveBtn.onClick = () => {
			let pages = dialog.pagesGroup.pages.text;

			if (!!pages.length) {
				if (!this.isValidPagesSyntax(pages)) {
					return;
				}
			}

			let ext = app.activeDocument.name.split('.').pop();
			this.articleName = !!dialog.articleNameGroup.articleName.text ? dialog.articleNameGroup.articleName.text : app.activeDocument.name.replace(`.${ext}`, '');

			this.savedSettings.pages = pages;
			dialog.close(1);
		};

		dialog.buttonsBarGroup.cancelBtn.onClick = () => {
			dialog.close(0);
		};

		return dialog.show();
	}

	publish() {
		if (this.canvasflowApi.getHealth() === null) {
			throw new Error('Error: \nThe Canvasflow service is not accessible. Please check your internet connection and try again.');
		}

		if (app.documents.length != 0) {
			let zipFilePath = '';
			const ext = app.activeDocument.name.split('.').pop();
			this.articleName = app.activeDocument.name.replace(`.${ext}`, '');
			let response = this.displayConfirmDialog();
			if (!!response) {
				let baseDirectory = `${app.activeDocument.filePath}/`;
				this.filePath = `${baseDirectory}${app.activeDocument.name}`; 
				this.baseDirectory = `${baseDirectory}${app.activeDocument.name.replace(`.${ext}`, '')}`;
				this.builder.savedSettings = this.savedSettings;
				
				// Search if there are unlinked images
				const missingImages = this.builder.getMissingImages();
				if(!!missingImages.length) {
					const missingImagesDialog = new MissingImagesDialog(missingImages);
					if(!missingImagesDialog.getResponse()) {
						alert('Build cancelled');
						return;
					}
				}

				zipFilePath = this.builder.build();
				if (!this.builder.isBuildSuccess) {
					alert('Build cancelled');
					return;
				}

				let now = new Date();
				let publishStartTime = now.getTime();

				if (this.uploadZip(zipFilePath)) {
					new File(zipFilePath).remove();
					now = new Date();
					alert('Success \nThe file has been published to Canvasflow');
					this.logger.log(`Publishing time: ${(now.getTime() - publishStartTime) / 1000} seconds`, 'timestamp');
				} else {
					now = new Date();
					this.logger.log(`Publishing with error: ${(now.getTime() - publishStartTime) / 1000} seconds`, 'timestamp');
					throw new Error('Error uploading the content, please try again');
				}
			}
		} else {
			alert('Please select an article to Publish');
		}
	}
}
