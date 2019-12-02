class Builder {
    os: string;
    resizeCommandFilePath: string;
    convertCommandFilePath: string;
    doc: Document;
    isBuildSuccess: boolean;

    imagesToResize: Array<any>;
    imagesToConvert: Array<any>;
    imageSizeCap: number;
    baseDirName: string;

    resizingImageLockFilePath: string;
    convertImageLockFilePath: string;
    savedSettings: any;
    logger: Logger;

    baseDirectory: string;

    filePath: string;

    uuid: string;

    constructor(canvasflowSettings: Settings, resizeCommandFilePath: string, convertCommandFilePath: string, os: string, logger: Logger) {
        this.resizeCommandFilePath = resizeCommandFilePath || '';
        this.convertCommandFilePath = convertCommandFilePath || '';
        this.doc = app.activeDocument;

        this.os = os;
        this.imagesToResize = [];
        this.imagesToConvert = [];
        this.imageSizeCap = 1.5 * 1000000; // 1.5Mb
        this.baseDirName = 'cf-indesign';
        this.isBuildSuccess = true;

        this.resizingImageLockFilePath = getBasePath() + '/' + this.baseDirName + '/canvasflow_resizing.lock';
        this.convertImageLockFilePath = getBasePath() + '/' + this.baseDirName + '/canvasflow_convert.lock';

        this.savedSettings = canvasflowSettings.getSavedSettings();
        this.logger = logger;
    }

    createExportFolder() {
        var f = new Folder(this.baseDirectory);
        if (f.exists) {
            f.remove()
        }
    
        f.create()
        var imageDirectory = new Folder(this.baseDirectory + '/images');
        imageDirectory.create();
    }

    getUUIDFromDocument(doc) {
        var label = doc.extractLabel('CANVASFLOW-ID');
        if(!!label) {
            return label;
        }
        return '';
    }

    getUUIDReplacer(c): string {
        var dt = new Date().getTime();
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    }

    getUUID(){
        // @ts-ignore
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, this.getUUIDReplacer);
        return uuid.substring(0, uuid.length / 2);
    }

    getDocumentID() {
        var uuid = this.getUUIDFromDocument(this.doc);
        if(!uuid) {
            // @ts-ignore
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, this.getUUIDReplacer);
            uuid = uuid.substring(0, uuid.length / 2);
            this.doc.insertLabel('CANVASFLOW-ID', uuid);
            try {
                this.doc.save(this.doc.filePath);
            } catch(e) {
                throw new Error('Please save the document before building the file');
            }   
        }

        return uuid;
    }

    getItemPosition(bounds) {
        var xi = bounds[1];
        var yi = bounds[0];
        var xf = bounds[3];
        var yf = bounds[2];

        var width = xf - xi;
        var height = yf - yi;

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
        }
    }

    appendToTextFrames(textFrames, elements) {
        if(elements.length > 0) {
            for(var i = 0; i < elements.length; i++) {
                var element = elements[i];
                if(!!element.textFrames) {
                    for(var j = 0; j < element.textFrames.length; j++) {
                        textFrames.push(element.textFrames[j]);
                    }
                }
            }
        }
    }

    getFontFromParagraphs(textFrame) {
        var paragraphs = textFrame.paragraphs;
        if(!!paragraphs.count()) {
            var paragraph = paragraphs.item(0);
            return {
                fontFamily: paragraph.appliedFont.fontFamily,
                fontSize: paragraph.pointSize,
            }
        }

        return {
            fontFamily: textFrame.appliedObjectStyle.appliedParagraphStyle.appliedFont.fontFamily,
            fontSize: textFrame.appliedObjectStyle.appliedParagraphStyle.pointSize
        }
    }

    cleanSubstringContent(substring) {
        if(typeof substring === 'string') {
            return substring
                .replace(/(1396984945)*/, '\u201C');   
        }
        return substring
            .toString()
            .replace(/(1396984945)*/, '\u201C');   
    }

    getRealCharacter(content) {
        if(content == SpecialCharacters.SINGLE_RIGHT_QUOTE) {
            content = '\u2019';
        } else if(content == SpecialCharacters.ARABIC_COMMA) {
            content = '\u060C';
        } else if(content == SpecialCharacters.ARABIC_KASHIDA) {
            content = '\u0640';
        } else if(content == SpecialCharacters.ARABIC_QUESTION_MARK) {
            content = '\u061F';
        } else if(content == SpecialCharacters.ARABIC_SEMICOLON) {
            content = '\u061B';
        } else if(content == SpecialCharacters.BULLET_CHARACTER) {
            content = '\u2022';
        } else if(content == SpecialCharacters.COPYRIGHT_SYMBOL) {
            content = '\u00A9';
        } else if(content == SpecialCharacters.DEGREE_SYMBOL) {
            content = '\u00B0';
        } else if(content == SpecialCharacters.DISCRETIONARY_HYPHEN) {
            content = '\u00AD';
        } else if(content == SpecialCharacters.DOTTED_CIRCLE) {
            content = '\u25CC';
        } else if(content == SpecialCharacters.DOUBLE_LEFT_QUOTE) {
            content = '\u201C';
        } else if(content == SpecialCharacters.DOUBLE_RIGHT_QUOTE) {
            content = '\u201D';
        } else if(content == SpecialCharacters.DOUBLE_STRAIGHT_QUOTE) {
            content = '\u0022';
        } else if(content == SpecialCharacters.ELLIPSIS_CHARACTER) {
            content = '\u2026';
        } else if(content == SpecialCharacters.EM_DASH) {
            content = '\u2014';
        } else if(content == SpecialCharacters.EM_SPACE) {
            content = '\u2003';
        } else if(content == SpecialCharacters.EN_DASH) {
            content = '\u2013';
        } else if(content == SpecialCharacters.EN_SPACE) {
            content = '\u0020';
        } else if(content == SpecialCharacters.HEBREW_GERESH) {
            content = '\u05F3';
        } else if(content == SpecialCharacters.HEBREW_GERSHAYIM) {
            content = '\u05F4';
        } else if(content == SpecialCharacters.HEBREW_MAQAF) {
            content = '\u05BE';
        } else if(content == SpecialCharacters.LEFT_TO_RIGHT_EMBEDDING) {
            content = '\u202A';
        } else if(content == SpecialCharacters.LEFT_TO_RIGHT_MARK) {
            content = '\u200E';
        } else if(content == SpecialCharacters.LEFT_TO_RIGHT_OVERRIDE) {
            content = '\u202D';
        } else if(content == SpecialCharacters.NONBREAKING_HYPHEN) {
            content = '\u2011';
        } else if(content == SpecialCharacters.NONBREAKING_SPACE) {
            content = '\u00A0';
        } else if(content == SpecialCharacters.PARAGRAPH_SYMBOL) {
            content = '\u2761';
        } else if(content == SpecialCharacters.POP_DIRECTIONAL_FORMATTING) {
            content = '\u202C';
        } else if(content == SpecialCharacters.PREVIOUS_PAGE_NUMBER) {
            content = '\u2397';
        } else if(content == SpecialCharacters.PUNCTUATION_SPACE) {
            content = '\u2008';
        } else if(content == SpecialCharacters.REGISTERED_TRADEMARK) {
            content = '\u00AE';
        } else if(content == SpecialCharacters.RIGHT_TO_LEFT_EMBEDDING) {
            content = '\u202B';
        } else if(content == SpecialCharacters.RIGHT_TO_LEFT_MARK) {
            content = '\u200F';
        } else if(content == SpecialCharacters.RIGHT_TO_LEFT_OVERRIDE) {
            content = '\u202E';
        } else if(content == SpecialCharacters.SECTION_MARKER) {
            content = '\u00A7';
        } else if(content == SpecialCharacters.SECTION_SYMBOL) {
            content = '\u00A7';
        } else if(content == SpecialCharacters.SINGLE_LEFT_QUOTE) {
            content = '\u2018';
        } else if(content == SpecialCharacters.SINGLE_STRAIGHT_QUOTE) {
            content = '\u0027';
        } else if(content == SpecialCharacters.SIXTH_SPACE) {
            content = '\u2159';
        } else if(content == SpecialCharacters.TRADEMARK_SYMBOL) {
            content = '\u2122';
        } else if(content == SpecialCharacters.ZERO_WIDTH_JOINER) {
            content = '\u200D';
        } else if(content == SpecialCharacters.ZERO_WIDTH_NONJOINER) {
            content = '\u200C';
        } else if(content == SpecialCharacters.FORCED_LINE_BREAK) {
            content = '\u000A';
        }

        return content
    }

    isSameFont(previousFont, currentFont) {
        return previousFont.fontFamily === currentFont.fontFamily &&
            previousFont.fontSize === currentFont.fontSize &&
            previousFont.fontStyle === currentFont.fontStyle && 
            previousFont.fontColor.toString() === currentFont.fontColor.toString()
    }

    getSubstrings(characters, textFrameID) {
        var data = [];
        var substring = null;
        var fontStyle = 'Regular'; 
        
        for(var i = 0; i<characters.length; i++) {
            var character = characters.item(i);
            var parentTextFrameID = null;
            for(var j=0; j<character.parentTextFrames.length; j++) {
                var textFrame = character.parentTextFrames[j];
                parentTextFrameID = textFrame.id;
            }

            if(parentTextFrameID !== null) {
                if(parentTextFrameID !== textFrameID) {
                    continue;
                }
            }

            var fontColor = [0,0,0];
            try {
                var color = app.activeDocument.colors.item(character.fillColor.name);
                color.space = ColorSpace.RGB;
                fontColor = color.colorValue;
            } catch(e) {
                fontColor = [0,0,0];
            }

            try {
                fontStyle = character.appliedFont.fontStyleName || 'Regular';
            } catch(e) {}

            var font = {
                fontFamily: character.appliedFont.fontFamily,
                fontSize: character.pointSize,
                fontStyle: fontStyle,
                fontColor: fontColor
            };
            
            if(substring == null) {
                substring = {
                    content: character.contents,
                    font: font
                }
                continue;
            }

            var content = this.getRealCharacter(character.contents);
            if(!this.isSameFont(substring.font, font)) { 
                substring.content = this.cleanSubstringContent(substring.content);   
                data.push(substring);
                substring = {
                    content: content,
                    font: font
                }

                continue;
            }

            substring.content = substring.content + content;
        }

        if(substring !== null) {
            substring.content = this.cleanSubstringContent(substring.content);
            data.push(substring);
        }

        return data;
    }

    getParagraphs(paragraphs, textFrameID) {
        var response = [];
        for(var i=0; i < paragraphs.count(); i++) {
            var paragraph = paragraphs.item(i);
            if(paragraph.contents === '\r') {
                continue
            }

            var characterFontFamily = paragraph.appliedCharacterStyle.appliedFont;
            var characterFontSize = paragraph.appliedCharacterStyle.pointSize;

            var characterStyle ={
                fontFamily: characterFontFamily,
                fontSize: characterFontSize
            };

            if(!characterStyle.fontFamily) {
                characterStyle.fontFamily = null;
            }
            
            if(typeof characterStyle.fontSize == 'object') {
                characterStyle.fontSize = null;
            } 

            response.push({
                content: paragraph.contents,
                font: {
                    fontFamily: paragraph.appliedFont.fontFamily,
                    fontSize: paragraph.pointSize,
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

    getTextFrames(page, data) {
        var textFrames = [];
        for(var i = 0; i < page.textFrames.length; i++) {
            textFrames.push(page.textFrames[i]);
        }

        this.appendToTextFrames(textFrames, page.textBoxes);
        this.appendToTextFrames(textFrames, page.groups);

        for (var i = 0; i < textFrames.length; i++) {
            var textFrame = textFrames[i];
            var position = this.getItemPosition(textFrame.geometricBounds);
            if(!!textFrame.contents && !!textFrame.visible && !!textFrame.itemLayer.visible) {
                var next;
                var previous;
                var StoryID;
                try {
                    next = textFrame.nextTextFrame.id;
                } catch(e) {}
                
                try {
                    previous = textFrame.previousTextFrame.id;
                } catch(e) {}

                try {
                    StoryID = textFrame.parentStory.id;
                } catch(e) {}

                data.push({
                    type: 'TextFrame',
                    id: textFrame.id,
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

    checkIfGraphicImageExist(graphic) {
        var linkPath = graphic.itemLink.filePath;
        var originalImageFile = File(linkPath);
        return originalImageFile.exists;
    }

    exportImageRepresentation(image, imageDirectory, id) {
        var destFilePath = imageDirectory + '/' + id + '.jpg';
        destFilePath = destFilePath.replace(/%20/gi, ' ');

        try{
            image.exportFile(ExportFormat.JPG, new File(destFilePath)); 
        } catch(e) {
            alert('I failed trying to export this image: ' + destFilePath);
        }
        
        return '' + id + '.jpg';
    }

    isNotSupportedExtension(ext) {
        var exts: any = [
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
            'tga'
        ];

        return exts.indexOf(ext) === -1;
    }

    saveGraphicToImage(graphic, imageDirectory) {
        var id = graphic.id;

        var linkPath = graphic.itemLink.filePath;
        var originalImageFile = File(linkPath);
            
        var ext;
        var destFilePath;
        var fileName = originalImageFile.fsName; 
        
        ext = fileName.split('.').pop().toLowerCase();
        if(ext === 'jpg' || ext === 'jpeg') {
            ext = 'jpg';
        }

        destFilePath = imageDirectory + '/' + id + '.' + ext;
        destFilePath = destFilePath.replace(/%20/gi, ' ');

        if(this.isNotSupportedExtension(ext)) {
            if(!!this.logger) {
                this.logger.log('The image extension is not valid: "' + fileName + '", extension: ' + ext, 'timestamp');
            }
            return this.exportImageRepresentation(graphic, imageDirectory, id);
        }

        if(!originalImageFile.exists) {
            if(!!this.logger) {
                this.logger.log('Image does not exist: "' + fileName + '"', 'timestamp');
            }
            return this.exportImageRepresentation(graphic, imageDirectory, id);
        }

        this.logger.log('Image exists "' + fileName +'" and should be processed by the script', 'timestamp');

        var originalImageSize = originalImageFile.length;

        var targetExt;
        switch(ext) {
            case 'jpg':
            case 'jpeg':    
            case 'png':
            case 'gif':     
                targetExt = ext;   
            default:
                targetExt = 'jpg';
        }

        destFilePath = imageDirectory + '/' + id + '.' + targetExt;
        destFilePath = destFilePath.replace(/%20/gi, ' ');
        originalImageFile.copy(imageDirectory + '/' + id + '.' + ext);

        if(originalImageSize >= this.imageSizeCap) {
            var dataFile = new File(this.resizeCommandFilePath);
            if(!dataFile.exists) {
                throw new Error('The command "resize" required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@canvasflow.io if you require assistance.');
            }
            this.imagesToResize.push(File(imageDirectory + '/' + id + '.' + ext).fsName);
            return '' + id + '.' + targetExt;
        }
        
        if(targetExt !== ext) {
            var dataFile = new File(this.convertCommandFilePath);
            if(!dataFile.exists) {
                throw new Error('The command required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@canvasflow.io if you require assistance.');
            }
            this.imagesToConvert.push(File(imageDirectory + '/' + id + '.' + ext).fsName);
        }
               
        return '' + id + '.' + targetExt;
    }

    getVisibleBounds(graphic) {
        var bounds = graphic.visibleBounds;
        return {
            xi: bounds[1],
            yi: bounds[0],
            xf: bounds[3],
            yf: bounds[2],
        }
    }

    getImageFromGraphics(graphics, data, baseDirectory) {
        var imageDirectory = baseDirectory + '/images';
        if(graphics.length > 0) {
            for (var i = 0; i < graphics.length; i++) {
                var graphic = graphics[i];
                if(graphic.isValid && graphic.visible && !!graphic.itemLayer.visible) {
                    var imagePath = this.saveGraphicToImage(graphic, imageDirectory);
                    var position = this.getItemPosition(graphic.parent.geometricBounds);
                    var visibleBounds = this.getVisibleBounds(graphic);
                    data.push({
                        type: 'Image',
                        id: graphic.id,
                        label: graphic.label,
                        content: imagePath,
                        width: position.width,
                        height: position.height,
                        position: position,
                        visibleBounds: visibleBounds
                    });
                }
            }
        }
    }

    getImages(page, data, baseDirectory) {
        this.getImageFromGraphics(page.allGraphics, data, baseDirectory);
    }

    writeToFileScript(dataFile, lines) {
        for(var i=0; i < lines.length; i++) {
            var line = lines[i];
            dataFile.writeln(line);
        }
    }

    getResizeImagesScriptContent(files, shouldDeleteFiles) {
        var scriptBuilder = new ScriptBuilder(this.os, this.baseDirName);
        return scriptBuilder.getResizeImageScript(files, this.resizingImageLockFilePath, shouldDeleteFiles);
    }

    resizeImages(imageFiles) {
        var dataFile = new File(this.resizeCommandFilePath);
        if(!dataFile.exists) {
            throw new Error('The command "resize" required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@canvasflow.io if you require assistance.');
        }
    
        var files = [];
        var shouldDeleteFiles = [];
        for(var i = 0; i < imageFiles.length; i++) {
            if(this.os === 'dos') {
                files.push(imageFiles[i]);
            } else {
                var shouldDeleteFile = true;
                var ext = imageFiles[i].split('.').pop().toLowerCase();
                if(ext === 'jpg') {
                    shouldDeleteFile = false;
                }
                shouldDeleteFiles.push(shouldDeleteFile);
                files.push('"' + imageFiles[i] + '"');
            }
        }
        dataFile.encoding = 'UTF-8';
        dataFile.open('w');
        dataFile.lineFeed = 'Unix';

        this.writeToFileScript(dataFile, this.getResizeImagesScriptContent(files, shouldDeleteFiles));
    
        dataFile.execute();
        dataFile.close();
    }

    getConvertImagesScriptContent(files: Array<any>) {
        var scriptBuilder = new ScriptBuilder(this.os, this.baseDirName);
        return scriptBuilder.getConvertImageScript(files, this.convertImageLockFilePath);
    }

    convertImages(imageFiles: Array<any>) {
        var dataFile = new File(this.convertCommandFilePath);

        if(!dataFile.exists) {
            throw new Error('The command "convert" required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@canvasflow.io if you require assistance.');
        }

        var files = [];
        for(var i = 0; i < imageFiles.length; i++) {
            if(this.os === 'dos') {
                files.push(imageFiles[i]);
            } else {
                files.push('"' + imageFiles[i] + '"');
            }
        }
        dataFile.encoding = 'UTF-8';
        dataFile.open('w');
        dataFile.lineFeed = 'Unix';

        this.writeToFileScript(dataFile, this.getConvertImagesScriptContent(files));

        dataFile.execute();
        dataFile.close();
    }

    areAllImagesProcessed(baseDirectory) {
        var dataPath = baseDirectory + '/data.json'; 
        var dataFile = new File(dataPath);
        dataFile.open('r');
        
        // @ts-ignore
        var data = JSON.parse(dataFile.read());

        for(var i = 0; i < data.pages.length; i++) {
            var page = data.pages[i];
            for(var j = 0; j < page.items.length; j++) {
                var item = page.items[j];
                if(item.type === 'Image') {
                    var imagePath = baseDirectory + '/images/' + item.content;
                    var imageFile = new File(imagePath);
                    if(!imageFile.exists) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    removeMissingImageFromData(baseDirectory) {
        var dataPath = baseDirectory + '/data.json'; 
        var dataFile = new File(dataPath);
        dataFile.open('r');
        
        // @ts-ignore
        var data = JSON.parse(dataFile.read());
        var response = {
            pages: []
        };

        for(var i = 0; i < data.pages.length; i++) {
            var page = data.pages[i];
            var targetPage = {
                id: page.id,
                x: page.x,
                y: page.y,
                width: page.width,
                height: page.height,
                items: []
            };
            for(var j = 0; j < page.items.length; j++) {
                var item = page.items[j];
                if(item.type === 'Image') {
                    var imagePath = baseDirectory + '/images/' + item.content;
                    var imageFile = new File(imagePath);
                    if(!imageFile.exists) {
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
        alert('y')
    }

    createPackage(baseFile: File) {
        try {
            var resizingLockFile = new File(this.resizingImageLockFilePath)
            var convertLockFile = new File(this.convertImageLockFilePath)
            if(!resizingLockFile.exists && !convertLockFile.exists) {
                if(!this.areAllImagesProcessed(baseFile.fsName)) {
                    var response = confirm('Warning \nOne or more images are missing, do you still want to build?')
                    if(response) {
                        this.removeMissingImageFromData(baseFile.fsName);
                        // @ts-ignore
                        app.packageUCF(baseFile.fsName, baseFile.fsName + '.zip', 'application/zip');
                    } else {
                        this.isBuildSuccess = false;
                    }
                    removeDir(baseFile.fsName);
                    return;
                }
                // @ts-ignore
                app.packageUCF(baseFile.fsName, baseFile.fsName + '.zip', 'application/zip');
                removeDir(baseFile.fsName);
                return;
            }

            // @ts-ignore
            setTimeout(() => this.createPackage(baseFile), 1000);
        } catch(e) {
            // @ts-ignore
            setTimeout(() => this.createPackage(baseFile), 1000);
        }
    }

    cleanLocks() {
        var lockFile = new File(this.resizingImageLockFilePath)
		if(lockFile.exists) {
			lockFile.remove();
        }
        
        lockFile = new File(this.convertImageLockFilePath)
		if(lockFile.exists) {
			lockFile.remove();
		}
    }

    buildZipFile(document: Document, data, baseDirectory) {
        var output = baseDirectory + '/data.json'; 
        var dataFile = new File(output);
        if(dataFile.exists) {
            dataFile.remove();
        }
        dataFile.encoding = 'UTF-8';
        dataFile.open('w');
        
        // @ts-ignore
        dataFile.write(JSON.stringify(data));
        dataFile.close();

        var baseFile = new File(baseDirectory);

        this.cleanLocks();

        if(!!this.imagesToResize.length) { 
            var lockFile = new File(this.resizingImageLockFilePath)
            lockFile.encoding = 'UTF-8';
            lockFile.open('w');
            lockFile.close();
            this.resizeImages(this.imagesToResize);
        }
        
        if(!!this.imagesToConvert.length) {
            var lockFile = new File(this.convertImageLockFilePath)
            lockFile.encoding = 'UTF-8';
            lockFile.open('w');
            lockFile.close();
            this.convertImages(this.imagesToConvert);
        }

        this.createPackage(baseFile);
        // removeDir(baseFile.fsName);

        return baseFile.fsName + '.zip';
    }

    getDefaultPages() {
        var pages = [];
        for(var i = 0; i < this.doc.pages.length; i++) {
            pages.push(i+1);
        }
        return pages;
    }

    getRangePages(input: string) {
        var pages = [];
        var results = /^([0-9]+)(-)+([0-9]+)$/.exec(input);
        var lowerRange = parseInt(results[1]);
        var higherRange = parseInt(results[3]);
        var totalOfPages = this.doc.pages.length;

        if(!lowerRange) {
            throw new Error('The lower range should be bigger than 0');
        }

        if(!higherRange) {
            throw new Error('The higher range should be bigger than 0');
        }

        if(lowerRange > higherRange) {
            throw new Error('The lower range should be smaller than the higher range');
        }

        if(lowerRange > totalOfPages) {
            throw new Error('The lower range "' + lowerRange + '" should be smaller than the total of pages "' + totalOfPages + '"');
        }

        var initialPageIndex = lowerRange ;
        var lastPageIndex = higherRange;
            
        if (higherRange > totalOfPages) {
            lastPageIndex = totalOfPages
        }

        for(var i=initialPageIndex; i <= lastPageIndex; i++) {
            pages.push(i);
        }

        return pages;
    }

    isElementExist(arr: Array<any>, element) {
        for(var i = 0; i < arr.length; i++) {
            if(arr[i] === element) return true;
        }
        return false;
    }

    getUniqueArray(arr: Array<any>) {
        var response = [];
        for(var i = 0; i < arr.length; i++) {
            var element = arr[i];
            if(!this.isElementExist(response, element)) {
                response.push(element);
            }
        }
        return response;
    }

    getCSVPages(input: string) {
        var pages = [];
        var pagesString = input.split(',');
        for(var i=0; i < pagesString.length; i++) {
            var pageNumber = parseInt(pagesString[i]);
            if(!!pageNumber) {
                pages.push(pageNumber);
            }
        }
        pages = this.getUniqueArray(pages);
        return pages;
    }

    build() {
        this.isBuildSuccess = true;
        var baseDirectory = app.activeDocument.filePath + '/';
        this.filePath = baseDirectory + app.activeDocument.name;
        var ext = app.activeDocument.name.split('.').pop();
        this.baseDirectory = baseDirectory + app.activeDocument.name.replace('.' + ext, '');

        this.createExportFolder();

        var canvasflowBaseDir = new Folder(getBasePath() + '/' + this.baseDirName);
        if(!canvasflowBaseDir.exists) {
            canvasflowBaseDir.create();
        }
        
        baseDirectory = this.baseDirectory;
        var filePath = this.filePath;
            
        var templateFile = new File(filePath);
        templateFile.open('r');
            
        var document = app.activeDocument;
        var zeroPoint =  document.zeroPoint;
        document.zeroPoint = [0, 0];
            
        this.uuid = this.getDocumentID();
        var response = {
            pages: []
        };

        var settingPages = this.savedSettings.pages;

        var pages = this.getDefaultPages();

        if(!!settingPages) {
            if(!!/^([0-9]+)(-)+([0-9]+)$/.exec(settingPages)) {
                pages = this.getRangePages(settingPages);
            } else if(!!/^(\d)+(,\d+)*$/.exec(settingPages)) {
                pages = this.getCSVPages(settingPages);
            } else {
                throw new Error('The range for pages has an invalid syntax');
            }
        }

        var totalOfPages = pages.length;

        // This set the document to pixels
        app.activeDocument.viewPreferences.horizontalMeasurementUnits = 2054187384;
        app.activeDocument.viewPreferences.verticalMeasurementUnits = 2054187384;

        // @ts-ignore
        var w = new Window ('palette', 'Processing pages');
        w.progressBar = w.add('progressbar', undefined, 0, totalOfPages);
        w.progressText = w.add('statictext', [0, 0, 100, 20], 'Page 0 of '+ totalOfPages);
        w.progressBar.preferredSize.width = 300;
        w.show();
        
        do {
            var pageIndex = pages.shift() - 1;
            var page = document.pages[pageIndex];
            var position = this.getItemPosition(page.bounds);
            var pageData = {
                id: page.id,
                x: position.x,
                y: position.y,
                width: position.width,
                height: position.height,
                items: []
            };
            this.getTextFrames(page, pageData.items);
            this.getImages(page, pageData.items, baseDirectory);
            response.pages.push(pageData);
            w.progressBar.value = w.progressBar.value + 1;
            w.progressText.text = 'Page ' + w.progressBar.value + ' of ' + totalOfPages;
        } while(pages.length !== 0)

        document.zeroPoint = zeroPoint;

        return this.buildZipFile(document, response, baseDirectory);
    }
}