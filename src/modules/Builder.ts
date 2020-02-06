class Builder {
	private os: string;
	private document: Document;
	private logger: Logger;

	private imageSizeCap: number;

	private resizeCommandFilePath: string;
	private resizingImageLockFilePath: string;
	private imagesToResize: Array<any>;
	
	private convertCommandFilePath: string;
	private convertImageLockFilePath: string;
	private imagesToConvert: Array<any>;
	
	private baseDirName: string;
	private baseDirectory: string;
	private filePath: string;
	 
	public uuid: string;
	public isBuildSuccess: boolean;
	public savedSettings: any;

	constructor(canvasflowSettings: Settings, resizeCommandFilePath: string, convertCommandFilePath: string, os: string, logger: Logger) {
		this.resizeCommandFilePath = resizeCommandFilePath || '';
		this.convertCommandFilePath = convertCommandFilePath || '';
		this.document = app.activeDocument;

		this.os = os;
		this.imagesToResize = [];
		this.imagesToConvert = [];
		this.imageSizeCap = 1.5 * 1000000; // 1.5Mb
		this.baseDirName = 'cf-indesign';
		this.isBuildSuccess = true;
		
		this.resizingImageLockFilePath = `${getBasePath()}/${this.baseDirName}/canvasflow_resizing.lock`;
		this.convertImageLockFilePath = `${getBasePath()}/${this.baseDirName}/canvasflow_convert.lock`;

		this.savedSettings = canvasflowSettings.getSavedSettings();
		this.logger = logger;
	}

	createExportFolder() {
		let f = new Folder(this.baseDirectory);
		if (f.exists) {
			f.remove();
		}

		f.create();
		let imageDirectory = new Folder(`${this.baseDirectory}/images`);
		imageDirectory.create();
	}

	getUUIDFromDocument(document: Document) {
		let label = document.extractLabel('CANVASFLOW-ID');
		if (!!label) {
			return label;
		}
		return '';
	}

	getUUIDReplacer(c: any): string {
		let dt = new Date().getTime();
		let r = (dt + Math.random() * 16) % 16 | 0;
		dt = Math.floor(dt / 16);
		return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
	}

	getUUID() {
		// @ts-ignore
		let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,this.getUUIDReplacer);
		return uuid.substring(0, uuid.length / 2);
	}

	getDocumentID() {
		let uuid = this.getUUIDFromDocument(this.document);
		if (!uuid) {
			// @ts-ignore
			let uuid = this.getUUID();
			this.document.insertLabel('CANVASFLOW-ID', uuid);
			try {
				this.document.save(this.document.filePath);
			} catch (e) {
				throw new Error('Please save the document before building the file');
			}
		}

		return uuid;
	}

	getItemPosition(bounds: any) {
		let xi = bounds[1];
		let yi = bounds[0];
		let xf = bounds[3];
		let yf = bounds[2];

		let width = xf - xi;
		let height = yf - yi;

		return {
			width: width,
			height: height,
			/*bounds: {
                xi: xi,
                xf: xf,
                yi: yi,
                yf: yf
            },*/
			x: xi,
			y: yi
		};
	}

	appendToTextFrames(textFrames: any, elements: any) {
		for(let element of elements) {
			if (!!element.textFrames) {
				for(let textFrame of element.textFrames) {
					textFrames.push(textFrame);
				}
			}
		}
	}

	getFontFromParagraphs(textFrame: any) {
		let paragraphs = textFrame.paragraphs;
		if (!!paragraphs.count()) {
			let paragraph = paragraphs.item(0);
			return {
				fontFamily: paragraph.appliedFont.fontFamily,
				fontSize: paragraph.pointSize
			};
		}

		return {
			fontFamily: textFrame.appliedObjectStyle.appliedParagraphStyle.appliedFont.fontFamily,
			fontSize: textFrame.appliedObjectStyle.appliedParagraphStyle.pointSize
		};
	}

	cleanSubstringContent(substring: any) {
		try {
			if (typeof substring === 'string') {
				return substring.replace(/(1396984945)*/, '\u201C');
			}
			return substring.toString().replace(/(1396984945)*/, '\u201C');
		} catch(e) {
			return substring;
		}
	}

	getRealCharacter(content: any) {
		if (content == SpecialCharacters.SINGLE_RIGHT_QUOTE) {
			content = '\u2019';
		} else if (content == SpecialCharacters.ARABIC_COMMA) {
			content = '\u060C';
		} else if (content == SpecialCharacters.ARABIC_KASHIDA) {
			content = '\u0640';
		} else if (content == SpecialCharacters.ARABIC_QUESTION_MARK) {
			content = '\u061F';
		} else if (content == SpecialCharacters.ARABIC_SEMICOLON) {
			content = '\u061B';
		} else if (content == SpecialCharacters.BULLET_CHARACTER) {
			content = '\u2022';
		} else if (content == SpecialCharacters.COPYRIGHT_SYMBOL) {
			content = '\u00A9';
		} else if (content == SpecialCharacters.DEGREE_SYMBOL) {
			content = '\u00B0';
		} else if (content == SpecialCharacters.DISCRETIONARY_HYPHEN) {
			content = '\u00AD';
		} else if (content == SpecialCharacters.DOTTED_CIRCLE) {
			content = '\u25CC';
		} else if (content == SpecialCharacters.DOUBLE_LEFT_QUOTE) {
			content = '\u201C';
		} else if (content == SpecialCharacters.DOUBLE_RIGHT_QUOTE) {
			content = '\u201D';
		} else if (content == SpecialCharacters.DOUBLE_STRAIGHT_QUOTE) {
			content = '\u0022';
		} else if (content == SpecialCharacters.ELLIPSIS_CHARACTER) {
			content = '\u2026';
		} else if (content == SpecialCharacters.EM_DASH) {
			content = '\u2014';
		} else if (content == SpecialCharacters.EM_SPACE) {
			content = '\u2003';
		} else if (content == SpecialCharacters.EN_DASH) {
			content = '\u2013';
		} else if (content == SpecialCharacters.EN_SPACE) {
			content = '\u0020';
		} else if (content == SpecialCharacters.HEBREW_GERESH) {
			content = '\u05F3';
		} else if (content == SpecialCharacters.HEBREW_GERSHAYIM) {
			content = '\u05F4';
		} else if (content == SpecialCharacters.HEBREW_MAQAF) {
			content = '\u05BE';
		} else if (content == SpecialCharacters.LEFT_TO_RIGHT_EMBEDDING) {
			content = '\u202A';
		} else if (content == SpecialCharacters.LEFT_TO_RIGHT_MARK) {
			content = '\u200E';
		} else if (content == SpecialCharacters.LEFT_TO_RIGHT_OVERRIDE) {
			content = '\u202D';
		} else if (content == SpecialCharacters.NONBREAKING_HYPHEN) {
			content = '\u2011';
		} else if (content == SpecialCharacters.NONBREAKING_SPACE) {
			content = '\u00A0';
		} else if (content == SpecialCharacters.PARAGRAPH_SYMBOL) {
			content = '\u2761';
		} else if (content == SpecialCharacters.POP_DIRECTIONAL_FORMATTING) {
			content = '\u202C';
		} else if (content == SpecialCharacters.PREVIOUS_PAGE_NUMBER) {
			content = '\u2397';
		} else if (content == SpecialCharacters.PUNCTUATION_SPACE) {
			content = '\u2008';
		} else if (content == SpecialCharacters.REGISTERED_TRADEMARK) {
			content = '\u00AE';
		} else if (content == SpecialCharacters.RIGHT_TO_LEFT_EMBEDDING) {
			content = '\u202B';
		} else if (content == SpecialCharacters.RIGHT_TO_LEFT_MARK) {
			content = '\u200F';
		} else if (content == SpecialCharacters.RIGHT_TO_LEFT_OVERRIDE) {
			content = '\u202E';
		} else if (content == SpecialCharacters.SECTION_MARKER) {
			content = '\u00A7';
		} else if (content == SpecialCharacters.SECTION_SYMBOL) {
			content = '\u00A7';
		} else if (content == SpecialCharacters.SINGLE_LEFT_QUOTE) {
			content = '\u2018';
		} else if (content == SpecialCharacters.SINGLE_STRAIGHT_QUOTE) {
			content = "\u0027";
		} else if (content == SpecialCharacters.SIXTH_SPACE) {
			content = '\u2159';
		} else if (content == SpecialCharacters.TRADEMARK_SYMBOL) {
			content = '\u2122';
		} else if (content == SpecialCharacters.ZERO_WIDTH_JOINER) {
			content = '\u200D';
		} else if (content == SpecialCharacters.ZERO_WIDTH_NONJOINER) {
			content = '\u200C';
		} else if (content == SpecialCharacters.FORCED_LINE_BREAK) {
			content = '\u000A';
		}

		return content;
	}

	isSameFont(previousFont: any, currentFont: any) {
		return (
			previousFont.fontFamily === currentFont.fontFamily &&
			previousFont.fontSize === currentFont.fontSize &&
			previousFont.fontStyle === currentFont.fontStyle &&
			previousFont.fontColor.toString() === currentFont.fontColor.toString()
		);
	}

	getSubstrings(characters: any, textFrameID: any) {
		let data = [];
		let substring = null;
		let fontStyle = 'Regular';
		for(let character of characters) {
			let parentTextFrameID = null;
			for(let textFrame of character.parentTextFrames) {
				parentTextFrameID = textFrame.id;
			}

			if (parentTextFrameID !== null && (parentTextFrameID !== textFrameID)) {
				continue;
			}

			let fontColor = [0, 0, 0];
			try {
				let color = app.activeDocument.colors.item(character.fillColor.name);
				color.space = ColorSpace.RGB;
				fontColor = color.colorValue;
			} catch (e) {
				fontColor = [0, 0, 0];
			}

			try {
				fontStyle = character.appliedFont.fontStyleName || 'Regular';
			} catch (e) {}

			let font = {
				fontFamily: character.appliedFont.fontFamily,
				fontSize: character.pointSize,
				fontStyle: fontStyle,
				fontColor: fontColor
			};

			if (substring == null) {
				substring = {
					content: character.contents,
					font: font
				};
				continue;
			}

			let content = this.getRealCharacter(character.contents);
			if (!this.isSameFont(substring.font, font)) {
				substring.content = this.cleanSubstringContent(substring.content);
				data.push(substring);
				substring = {
					content: content,
					font: font
				};

				continue;
			}

			substring.content = substring.content + content;
		}

		if (substring !== null) {
			substring.content = this.cleanSubstringContent(substring.content);
			data.push(substring);
		}

		return data;
	}

	getParagraphs(paragraphs: any, textFrameID: any) {
		let response = [];
		for(let paragraph of paragraphs) {
			if (paragraph.contents === '\r') {
				continue;
			}

			let characterFontFamily = paragraph.appliedCharacterStyle.appliedFont;
			let characterFontSize = paragraph.appliedCharacterStyle.pointSize;

			let characterStyle = {
				fontFamily: characterFontFamily,
				fontSize: characterFontSize
			};

			if (!characterStyle.fontFamily) {
				characterStyle.fontFamily = null;
			}

			if (typeof characterStyle.fontSize == 'object') {
				characterStyle.fontSize = null;
			}

			response.push({
				content: paragraph.contents,
				font: {
					fontFamily: paragraph.appliedFont.fontFamily,
					fontSize: paragraph.pointSize
				},
				substrings: this.getSubstrings(paragraph.characters, textFrameID),
				characterStyle: characterStyle,
				paragraphStyle: {
					fontFamily: paragraph.appliedParagraphStyle.appliedFont.fontFamily,
					fontSize: paragraph.appliedParagraphStyle.pointSize
				}
			});
		}

		return response;
	}

	getTextFrames(page: any, data: any) {
		let textFrames = [];
		for(let textFrame of page.textFrames) {
			textFrames.push(textFrame);
		}

		this.appendToTextFrames(textFrames, page.textBoxes);
		this.appendToTextFrames(textFrames, page.groups);

		for(let textFrame of textFrames) {
			let position = this.getItemPosition(textFrame.geometricBounds);
			if (!!textFrame.contents && !!textFrame.visible && !!textFrame.itemLayer.visible) {
				let next: any;
				let previous: any;
				let StoryID: any;
				try {
					next = textFrame.nextTextFrame.id;
				} catch (e) {}

				try {
					previous = textFrame.previousTextFrame.id;
				} catch (e) {}

				try {
					StoryID = textFrame.parentStory.id;
				} catch (e) {}

				let tag;
				try {
					tag = textFrame.parentStory.associatedXMLElement.properties.markupTag.name;
				} catch(e) {
					tag = undefined;
				}

				data.push({
					type: 'TextFrame',
					id: textFrame.id,
					tag: tag,
					label: textFrame.label,
					storyId: StoryID,
					next: next,
					previous: previous,
					content: textFrame.contents,
					width: position.width,
					height: position.height,
					font: this.getFontFromParagraphs(textFrame),
					paragraphs: this.getParagraphs(textFrame.paragraphs, textFrame.id),
					position: position
				});
			}
		}
	}

	checkIfGraphicImageExist(graphic: Graphic): boolean {
		try {
			let linkPath: any = graphic.itemLink.filePath;
			let originalImageFile = new File(linkPath);
			return originalImageFile.exists;
		} catch(e) {
			return false;
		}
	}

	exportImageRepresentation(image: any, imageDirectory: string, id: number) {
		let destFilePath = `${imageDirectory}/${id}.jpg`;
		destFilePath = destFilePath.replace(/%20/gi, ' ');

		try {
			image.exportFile(ExportFormat.JPG, new File(destFilePath));
		} catch (e) {
			alert(`I failed trying to export this image: ${destFilePath}`);
		}

		return `${id}.jpg`;
	}

	isNotSupportedExtension(ext: string) {
		let exts: any = [
			'jpg',
			'jpeg',
			'eps',
			'tiff',
			'tif',
			'png',
			'gif',
			'jp2',
			'pict',
			'bmp',
			'qtif',
			'psd',
			'sgi',
			'tga',
			'pdf'
		];

		return exts.indexOf(ext) === -1;
	}

	saveGraphicToImage(graphic: Graphic, imageDirectory: string) {
		let id = graphic.id;

		if(!graphic.itemLink) {
			if (!!this.logger) {
				this.logger.log(`Image with ID "${id}" do not have and itemLink associated with it`, 'timestamp');
			}
			return this.exportImageRepresentation(graphic, imageDirectory, id);
		}

		let linkPath: any = graphic.itemLink.filePath;
		let originalImageFile = File(linkPath);

		let ext: string;
		let destFilePath: string;
		let fileName = originalImageFile.fsName;

		ext = fileName
			.split('.')
			.pop()
			.toLowerCase();

		if (ext === 'jpg' || ext === 'jpeg') {
			ext = 'jpg';
		}

		destFilePath = `${imageDirectory}/${id}.${ext}`;
		destFilePath = destFilePath.replace(/%20/gi, ' ');

		if (this.isNotSupportedExtension(ext)) {
			if (!!this.logger) {
				this.logger.log(`The image extension is not valid: "${fileName}", extension: ${ext}`, 'timestamp');
			}
			return this.exportImageRepresentation(graphic, imageDirectory, id);
		}

		if (!originalImageFile.exists) {
			if (!!this.logger) {
				this.logger.log(`Image does not exist: "${fileName}"`, 'timestamp');
			}
			return this.exportImageRepresentation(graphic, imageDirectory, id);
		}

		this.logger.log(`Image exists "${fileName}" and should be processed by the script`, 'timestamp');

		let originalImageSize = originalImageFile.length;

		let targetExt: string;
		switch (ext) {
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
				targetExt = ext;
			default:
				targetExt = 'jpg';
		}

		destFilePath = `${imageDirectory}/${id}.${targetExt}`; 
		destFilePath = destFilePath.replace(/%20/gi, ' ');
		originalImageFile.copy(`${imageDirectory}/${id}.${ext}`); 

		if (originalImageSize >= this.imageSizeCap) {
			let dataFile = new File(this.resizeCommandFilePath);
			if (!dataFile.exists) {
				throw new Error('The command "resize" required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@canvasflow.io if you require assistance.');
			}
			
			this.imagesToResize.push((new File(`${imageDirectory}/${id}.${ext}`)).fsName);
			return `${id}.${targetExt}`;
		}

		if (targetExt !== ext) {
			let dataFile = new File(this.convertCommandFilePath);
			if (!dataFile.exists) {
				alert(this.convertCommandFilePath);
				throw new Error('The command "convert" required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@canvasflow.io if you require assistance.');
			}
			this.imagesToConvert.push((new File(`${imageDirectory}/${id}.${ext}`)).fsName);
		}
		return `${id}.${targetExt}`;
	}

	getVisibleBounds(graphic: Graphic) {
		let bounds = graphic.visibleBounds;
		return {
			xi: bounds[1],
			yi: bounds[0],
			xf: bounds[3],
			yf: bounds[2]
		};
	}

	getImageFromGraphics(graphics: any, data: any, baseDirectory: string) {
		let imageDirectory = `${baseDirectory}/images`;
		for(let graphic of graphics) {
			if (graphic.isValid && graphic.visible && !!graphic.itemLayer.visible) {
				let imagePath = this.saveGraphicToImage(graphic, imageDirectory);
				let position = this.getItemPosition(graphic.parent.visibleBounds);
				let image = this.getItemPosition(graphic.geometricBounds);

				let tag;
				try {
					tag = graphic.associatedXMLElement.properties.markupTag.name
				} catch(e) {
					tag = undefined;
				}

				data.push({
					type: 'Image',
					id: graphic.id,
					tag: tag,
					label: graphic.label,
					content: imagePath,
					width: position.width,
					height: position.height,
					position: position,
					image: image
				});
			}
		}
	}

	getImages(page: any, data: any, baseDirectory: string) {
		this.getImageFromGraphics(page.allGraphics, data, baseDirectory);
	}

	writeToFileScript(dataFile: File, lines: Array<any>) {
		for(let line of lines) {
			dataFile.writeln(line);
		}
	}

	getResizeImagesScriptContent(files: Array<string>, shouldDeleteFiles: Array<boolean>) {
		let scriptBuilder = new ScriptBuilder(this.os, this.baseDirName);
		return scriptBuilder.getResizeImageScript(files, this.resizingImageLockFilePath, shouldDeleteFiles);
	}

	resizeImages(imageFiles: Array<string>) {
		let dataFile = new File(this.resizeCommandFilePath);
		if (!dataFile.exists) {
			throw new Error('The command "resize" required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@canvasflow.io if you require assistance.');
		}

		let files: Array<string> = [];
		let shouldDeleteFiles: Array<boolean> = [];
		for(let imageFile of imageFiles) {
			if (this.os === 'dos') {
				files.push(imageFile);
			} else {
				let shouldDeleteFile = true;
				let ext = imageFile
					.split('.')
					.pop()
					.toLowerCase();
				if (ext === 'jpg') {
					shouldDeleteFile = false;
				}
				shouldDeleteFiles.push(shouldDeleteFile);
				files.push(`"${imageFile}"`);
			}
		}

		dataFile.encoding = 'UTF-8';
		dataFile.open('w');
		dataFile.lineFeed = 'Unix';

		this.writeToFileScript(dataFile,this.getResizeImagesScriptContent(files, shouldDeleteFiles));
		

		dataFile.execute();
		dataFile.close();
	}

	getConvertImagesScriptContent(files: Array<any>) {
		let scriptBuilder = new ScriptBuilder(this.os, this.baseDirName);
		return scriptBuilder.getConvertImageScript(files,this.convertImageLockFilePath);
	}

	convertImages(imageFiles: Array<string>) {
		let dataFile = new File(this.convertCommandFilePath);

		if (!dataFile.exists) {
			throw new Error('The command "convert" required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@canvasflow.io if you require assistance.');
		}

		let files: Array<string> = [];
		for(let imageFile of imageFiles) {
			if (this.os === 'dos') {
				files.push(imageFile);
			} else {
				files.push(`"${imageFile}"`);
			}
		}
		dataFile.encoding = 'UTF-8';
		dataFile.open('w');
		dataFile.lineFeed = 'Unix';

		this.writeToFileScript(dataFile, this.getConvertImagesScriptContent(files));

		dataFile.execute();
		dataFile.close();
	}

	areAllImagesProcessed(baseDirectory: string) {
		let dataPath = `${baseDirectory}/data.json`; 
		let dataFile = new File(dataPath);
		dataFile.open('r');

		// @ts-ignore
		let data = JSON.parse(dataFile.read());

		for (let page of data.pages) {
			for(let item of page.items) {
				if (item.type === 'Image') {
					let imagePath = `${baseDirectory}/images/${item.content}`; 
					let imageFile = new File(imagePath);
					if (!imageFile.exists) {
						return false;
					}
				}
			}
		}

		return true;
	}

	removeMissingImageFromData(baseDirectory: string) {
		let dataPath = `${baseDirectory}/data.json`; 
		let dataFile = new File(dataPath);
		dataFile.open('r');

		// @ts-ignore
		let data = JSON.parse(dataFile.read());
		let response = {
			pages: []
		};

		for(let page of data.pages) {
			let targetPage = {
				id: page.id,
				x: page.x,
				y: page.y,
				width: page.width,
				height: page.height,
				items: []
			};
			for(let item of page.items) {
				if (item.type === 'Image') {
					let imagePath = `${baseDirectory}/images/${item.content}`; 
					let imageFile = new File(imagePath);
					if (!imageFile.exists) {
						continue;
					}
				}
				targetPage.items.push(item);
			}
			response.pages.push(targetPage);
		}

		dataFile.remove();
		dataFile.open('w');
		// @ts-ignore
		dataFile.write(JSON.stringify(response));
		dataFile.close();
	}

	createPackage(baseFile: File) {
		try {
			let resizingLockFile = new File(this.resizingImageLockFilePath);
			let convertLockFile = new File(this.convertImageLockFilePath);
			if (!resizingLockFile.exists && !convertLockFile.exists) {
				if (!this.areAllImagesProcessed(baseFile.fsName)) {
					let response = confirm('Warning \nOne or more images are missing, do you still want to build?');
					if (response) {
						this.removeMissingImageFromData(baseFile.fsName);
						app.packageUCF(baseFile, new File(`${baseFile.fsName}.zip`),'application/zip');
					} else {
						this.isBuildSuccess = false;
					}
					removeDir(baseFile.fsName);
					return;
				}
				// @ts-ignore
				app.packageUCF(baseFile, new File(`${baseFile.fsName}.zip`),'application/zip');
				removeDir(baseFile.fsName);
				return;
			}

			// @ts-ignore
			setTimeout(() => this.createPackage(baseFile), 1000);
		} catch (e) {
			// @ts-ignore
			setTimeout(() => this.createPackage(baseFile), 1000);
		}
	}

	cleanLocks() {
		let lockFile = new File(this.resizingImageLockFilePath);
		if (lockFile.exists) {
			lockFile.remove();
		}

		lockFile = new File(this.convertImageLockFilePath);
		if (lockFile.exists) {
			lockFile.remove();
		}
	}

	buildZipFile(data: any, baseDirectory: string) {
		let output = `${baseDirectory}/data.json`;
		let dataFile = new File(output);
		if (dataFile.exists) {
			dataFile.remove();
		}
		dataFile.encoding = 'UTF-8';
		dataFile.open('w');

		// @ts-ignore
		dataFile.write(JSON.stringify(data));
		dataFile.close();

		let baseFile = new File(baseDirectory);

		this.cleanLocks();

		if (!!this.imagesToResize.length) {
			let lockFile = new File(this.resizingImageLockFilePath);
			lockFile.encoding = 'UTF-8';
			lockFile.open('w');
			lockFile.close();
			this.resizeImages(this.imagesToResize);
		}

		if (!!this.imagesToConvert.length) {
			let lockFile = new File(this.convertImageLockFilePath);
			lockFile.encoding = 'UTF-8';
			lockFile.open('w');
			lockFile.close();
			this.convertImages(this.imagesToConvert);
		}

		this.createPackage(baseFile);
		removeDir(baseFile.fsName);

		return baseFile.fsName + '.zip';
	}

	getDefaultPages(): Array<any> {
		let pages = [];
		for (let i = 0; i < this.document.pages.length; i++) {
			const page = this.document.pages[i];
			if(page.isValid) {
				pages.push(page.name);
			}
		}
		return pages;
	}

	getRangePages(input: string) {
		let pages = [];
		let results = /^([0-9]+)(-)+([0-9]+)$/.exec(input);
		let lowerRange = parseInt(results[1]);
		let higherRange = parseInt(results[3]);
		let totalOfPages = this.document.pages.length;

		if (!lowerRange) {
			throw new Error('The lower range should be bigger than 0');
		}

		if (!higherRange) {
			throw new Error('The higher range should be bigger than 0');
		}

		if (lowerRange > higherRange) {
			throw new Error('The lower range should be smaller than the higher range');
		}

		if (lowerRange > totalOfPages) {
			throw new Error(`The lower range "${lowerRange}" should be smaller than the total of pages "${totalOfPages}"`);
		}

		let initialPageIndex = lowerRange;
		let lastPageIndex = higherRange;

		if (higherRange > totalOfPages) {
			lastPageIndex = totalOfPages;
		}

		for (let i = initialPageIndex; i <= lastPageIndex; i++) {
			pages.push(i);
		}

		return pages;
	}

	isElementExist(arr: Array<any>, element: any) {
		for (let i = 0; i < arr.length; i++) {
			if (arr[i] === element) return true;
		}
		return false;
	}

	getUniqueArray(arr: Array<any>) {
		let response = [];
		for (let i = 0; i < arr.length; i++) {
			let element = arr[i];
			if (!this.isElementExist(response, element)) {
				response.push(element);
			}
		}
		return response;
	}

	getCSVPages(input: string) {
		let pages = [];
		let pagesString = input.split(',');
		for (let i = 0; i < pagesString.length; i++) {
			let pageNumber = parseInt(pagesString[i]);
			if (!!pageNumber) {
				pages.push(pageNumber);
			}
		}
		pages = this.getUniqueArray(pages);
		return pages;
	}

	getPagesToProcess(): Array<any> {
		let settingPages = this.savedSettings.pages;
		if(!settingPages) {
			return this.getDefaultPages();
		}

		const pages = [];
		for(let item of settingPages.split(',')) {
			if(/([0-9]*)-([0-9]*)/.test(item)) {
				for(let page of this.getPagesFromRange(item)) {
					pages.push(page);
				}
			} else {
				pages.push(parseInt(item));
			}
		}
		return pages;
	}

	getPagesFromRange(range) {
		const result = range.match(/([0-9]*)-([0-9]*)/);
		let lower: number;
		let higher: number;
		let pages = [];

		if(parseInt(result[1]) > parseInt(result[2])) {
			lower = parseInt(result[2]);
			higher = parseInt(result[1]);
			for(let page = higher; page >= lower; page--) {
				pages.push(page);
			}
		} else if(parseInt(result[1]) < parseInt(result[2])) {
			lower = parseInt(result[1]);
			higher = parseInt(result[2]);
			for(let page = lower; page <= higher; page++) {
				pages.push(page);
			}
		} else {
			return [parseInt(result[1])];
		}

		return pages;
	}

	getInvalidPages() {
		const document = app.activeDocument;
		const invalidPages = []
		const pages = [...this.getPagesToProcess()];
		for(let pageNumber of pages) {
			if(!document.pages.itemByName(`${pageNumber}`).isValid) {
				invalidPages.push(pageNumber);
			}
		}

		return invalidPages;
	}

	getMissingImages(): Array<string> {
		const document = app.activeDocument;
		const missingImages = [];
		const pages = [...this.getPagesToProcess()];
		do {
			const pageNumber = pages.shift();
			const page = document.pages.itemByName(`${pageNumber}`);
			
			if(!!page) {
				if(!page.isValid) {
					throw new Error(`Error\nPage number ${pageNumber} does not exist. Please enter a valid page range and try again`)
				}
				if(!!page.allGraphics) {
					for(const graphic of page.allGraphics) {
						if(graphic.isValid && graphic.visible && !!graphic.itemLayer.visible) {
							if(!this.checkIfGraphicImageExist(graphic)) {
								if(!!graphic.itemLink) {
									const linkPath: any = graphic.itemLink.filePath
									const originalImageFile = new File(linkPath);
									missingImages.push(originalImageFile.fsName);
								}
							}
						}
					}
				}
			}
		
		} while (pages.length !== 0);
		return missingImages;
	}

	build() {
		this.isBuildSuccess = true;
		let baseDirectory = `${app.activeDocument.filePath}/`;
		this.filePath = `${baseDirectory}${app.activeDocument.name}`;
		const ext = app.activeDocument.name.split('.').pop();
		this.baseDirectory = `${baseDirectory}${app.activeDocument.name.replace(`.${ext}`, '')}`;

		this.createExportFolder();
		
		let canvasflowBaseDir = new Folder(`${getBasePath()}/${this.baseDirName}`);
		if (!canvasflowBaseDir.exists) {
			canvasflowBaseDir.create();
		}

		baseDirectory = this.baseDirectory;
		let filePath = this.filePath;

		let templateFile = new File(filePath);
		templateFile.open('r');

		let document = app.activeDocument;
		let zeroPoint = document.zeroPoint;
		document.zeroPoint = [0, 0];

		this.uuid = this.getDocumentID();
		let response = {
			pages: []
		};

		let pages = this.getPagesToProcess();

		let totalOfPages = pages.length;

		// This set the document to pixels
		app.activeDocument.viewPreferences.horizontalMeasurementUnits = 2054187384;
		app.activeDocument.viewPreferences.verticalMeasurementUnits = 2054187384;

		// @ts-ignore
		let w = new Window('palette', 'Processing pages');
		w.progressBar = w.add('progressbar', undefined, 0, totalOfPages);
		w.progressText = w.add(
			'statictext',
			[0, 0, 100, 20],
			`Page 0 of ${totalOfPages}`
		);
		w.progressBar.preferredSize.width = 300;
		w.show();

		let pageDataMapping = {};

		do {
			let pageData: any;
			let pageNumber = pages.shift();
			
			if(!!pageDataMapping[`${pageNumber}`]) {
				pageData = pageDataMapping[`${pageNumber}`];
			} else {
				let page = document.pages.itemByName(`${pageNumber}`);
				if(!page.isValid) {
					throw new Error(`Error\nPage number ${pageNumber} does not exist. Please enter a valid page range and try again`)
				}
				let position = this.getItemPosition(page.bounds);
				pageData = {
					id: page.id,
					x: position.x,
					y: position.y,
					width: position.width,
					height: position.height,
					items: []
				};
				this.getTextFrames(page, pageData.items);
				this.getImages(page, pageData.items, baseDirectory);
				pageDataMapping[`${pageNumber}`] = pageData;
			}
			
			response.pages.push(pageData);
			w.progressBar.value = w.progressBar.value + 1;
			w.progressText.text = `Page ${w.progressBar.value} of ${totalOfPages}`;
		} while (pages.length !== 0);

		document.zeroPoint = zeroPoint;

		return this.buildZipFile(response, baseDirectory);
	}
}
