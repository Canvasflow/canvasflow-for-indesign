//@include "json2.js"

var CanvasflowBuild = function(settingsPath) {
    var $ = this;

    $.settingsPath = settingsPath;

    $.getSavedSettings = function() {
        var file = new File($.settingsPath);
        if(file.exists) {
            file.open('r');
            return JSON.parse(file.read());
        }
    };
    $.savedSettings = $.getSavedSettings();

    $.createExportFolder = function() {
        var f = new Folder($.baseDirectory);
        if (f.exists) {
            f.remove()
        }
    
        f.create()
        var imageDirectory = new Folder($.baseDirectory + '/images');
        imageDirectory.create();
    }

    $.getUUIDFromDocument = function(doc) {
        var label = doc.extractLabel('CANVASFLOW-ID');
        if(!!label) {
            return label;
        }
        return '';
    }

    $.getUUID = function(){
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });

        return uuid.substring(0, uuid.length / 2);
    }

    $.getDocumentID = function(doc) {
        var uuid = $.getUUIDFromDocument(doc);
        if(!uuid) {
            uuid = $.getUUID();
            doc.insertLabel("CANVASFLOW-ID", uuid);
        }

        return uuid;
    }

    $.getItemPosition = function(bounds) {
        var width = bounds[3] - bounds[1];
        var offsetX = bounds[1];
        var x = (width / 2) + offsetX;
    
        var height = bounds[2] - bounds[0];
        var offsetY = bounds[0];
        var y = (height / 2) + offsetY;
    
        return {
            width: width,
            height: height,
            x: x,
            y: y
        }
    }

    $.appendTextBoxes = function (textFrames, textBoxes) {
        if(textBoxes.length > 0) {
            for(var i = 0; i < textBoxes.length; i++) {
                var textBox = textBoxes[i];
                for(var j = 0; j < textBox.textFrames.length; j++) {
                    textFrames.push(textBox.textFrames[j]);
                }
            }
        }
    }

    $.appendGroups = function (textFrames, groups) {
        if(groups.length > 0) {
            for(var i = 0; i < groups.length; i++) {
                var group = groups[i];
                for(var j = 0; j < group.textFrames.length; j++) {
                    textFrames.push(group.textFrames[j]);
                }
            }
        }
    }

    $.getFontFromParagraphs = function(textFrame) {
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

    $.getSubstrings = function(characters, textFrameID) {
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
            
            if(substring == null) {
                try {
                    fontStyle = character.appliedFont.fontStyleName || 'Regular';
                } catch(e) {}
                substring = {
                    content: character.contents,
                    font: {
                        fontFamily: character.appliedFont.fontFamily,
                        fontSize: character.pointSize,
                        fontStyle: fontStyle
                        // fontStyle: character.appliedFont.fontStyleName || 'Regular'
                    }
                }
                continue;
            }

            var previousFontFamily = substring.font.fontFamily;
            var previousFontSize = substring.font.fontFamily;
            var previousFontStyle = substring.font.fontStyle;
            var currentFontFamily = character.appliedFont.fontFamily;
            var currentFontSize = character.appliedFont.fontFamily;
            var currentFontStyle = 'Regular';
            try {
                currentFontStyle = character.appliedFont.fontStyleName || 'Regular';
            } catch(e) {}

           // if((previousFontFamily !== currentFontFamily) || (previousFontSize !== currentFontSize)) {
            if(previousFontStyle !== currentFontStyle) {    
                data.push(substring);
                substring = {
                    content: character.contents,
                    font: {
                        fontFamily: character.appliedFont.fontFamily,
                        fontSize: character.pointSize,
                        fontStyle: currentFontStyle,
                    }
                }

                continue;
            }

            var content = character.contents;
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

            substring.content = substring.content + content;
        }

        if(substring !== null) {
            data.push(substring);
        }

        return data;
    }

    $.getParagraphs = function(paragraphs, textFrameID) {
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
                substrings: $.getSubstrings(paragraph.characters, textFrameID),
                characterStyle: characterStyle,
                paragraphStyle: {
                    fontFamily: paragraph.appliedParagraphStyle.appliedFont.fontFamily,
                    fontSize: paragraph.appliedParagraphStyle.pointSize
                }
            });
        }
    
        return response;
    }

    $.getTextFrames = function(page, data) {
        var textFrames = [];
        for(var i = 0; i < page.textFrames.length; i++) {
            textFrames.push(page.textFrames[i]);
        }

        if(page.textBoxes.length > 0) {
            $.appendTextBoxes(textFrames, page.textBoxes)
        }

        if(page.groups.length > 0) {
            $.appendGroups(textFrames, page.groups)
        }

        for (var i = 0; i < textFrames.length; i++) {
            var textFrame = textFrames[i];
            var position = $.getItemPosition(textFrame.geometricBounds);
            if(!!textFrame.contents && !!textFrame.visible && !!textFrame.itemLayer.visible) {
                var next = null;
                try {
                    next = textFrame.nextTextFrame.id;
                } catch(e) {}
                data.push({
                    type: "TextFrame",
                    id: textFrame.id,
                    next: next,
                    content: textFrame.contents,
                    width: position.width,
                    height: position.height,
                    font: $.getFontFromParagraphs(textFrame),
                    paragraphs: $.getParagraphs(textFrame.paragraphs, textFrame.id),
                    position: {
                        x: position.x,
                        y: position.y
                    }
                });
            }
        }
    }

    $.checkIfGraphicImageExist = function(graphic) {
        var linkPath = graphic.itemLink.filePath;
        var originalImageFile = File(linkPath);
        return originalImageFile.exists;
    }

    $.exportImageRepresentation = function(image, ext, imageDirectory, id) {
        if(ext === 'jpg' || ext === 'jpeg') {
            ext = 'jpeg';
        } else {
            ext = 'png';
        }

        var destFilePath = imageDirectory + '/' + id + '.' + ext;

        image.exportFile(ext, File(destFilePath)); 

        return '' + id + '.' + ext;
    }

    $.saveGraphicToImage = function(graphic, imageDirectory) {
        var id = graphic.id;

        var linkPath = graphic.itemLink.filePath;
        var originalImageFile = File(linkPath);
            
        var ext;
        var destFilePath;
        var fileName = originalImageFile.fsName; 
        ext = fileName.split('.').pop().toLowerCase();
        if(ext === 'jpg' || ext === 'jpeg') {
            ext = 'jpeg';
        }

        destFilePath = imageDirectory + '/' + id + '.' + ext;
            
        if(!!originalImageFile.exists) {
            var originalImageSize = originalImageFile.length / 1000000; //In MB
                
            if(originalImageSize < 5) { 
                // The image is lower than 5MB
                if(ext === 'tif' || ext === 'psd') {
                    ext = 'png';
                    destFilePath = imageDirectory + '/' + id + '.' + ext;
                }

                originalImageFile.copy(destFilePath);
            } else {
                return $.exportImageRepresentation(graphic, ext, imageDirectory, id);
            }
        } else {
            return $.exportImageRepresentation(graphic, ext, imageDirectory, id);
        }
        return '' + id + '.' + ext;
    }

    $.getImageFromGraphics = function(graphics, data, baseDirectory) {
        var imageDirectory = baseDirectory + '/images';
        if(graphics.length > 0) {
            for (var i = 0; i < graphics.length; i++) {
                var graphic = graphics[i];
                if(graphic.isValid) {
                    var imagePath;
                    var position = $.getItemPosition(graphic.geometricBounds);
                    var imageExist = $.checkIfGraphicImageExist(graphic);
                    if(imageExist) {
                        if(graphic.visible) {
                            imagePath = $.saveGraphicToImage(graphic, imageDirectory);
                            data.push({
                                type: "Image",
                                id: graphic.id,
                                content: imagePath,
                                width: position.width,
                                height: position.height,
                                position: {
                                    x: position.x,
                                    y: position.y
                                }
                            });
                        }
                    } else {
                        if($.savedSettings.previewImage && graphic.visible) {
                            imagePath = $.saveGraphicToImage(graphic, imageDirectory);
                            data.push({
                                type: "Image",
                                id: graphic.id,
                                content: imagePath,
                                width: position.width,
                                height: position.height,
                                position: {
                                    x: position.x,
                                    y: position.y
                                }
                            });
                        }
                    }
                }
            }
        }
    }

    $.getImages = function(page, data, baseDirectory) {
        $.getImageFromGraphics(page.allGraphics, data, baseDirectory);
    }

    $.createPreview = function(document, baseDirectory) {
        var imagePath = baseDirectory + '/preview.jpg';
        if(imagePath.exists) {
            imagePath.remove();
        }
        try {                           
            if($.isUniquePreview()) {
                app.jpegExportPreferences.pageString = app.activeDocument.pages.item(0).name;  
                app.jpegExportPreferences.jpegExportRange = ExportRangeOrAllPages.EXPORT_RANGE; 
                document.exportFile(ExportFormat.JPG, new File(imagePath));
            }
        } catch(e) {}
    }

    $.buildZipFile = function(document, data, baseDirectory) {
        var output = baseDirectory + '/data.json'; 
        var dataFile = new File(output);
        if(dataFile.exists) {
            dataFile.remove();
        }
        dataFile.encoding = 'UTF-8';
        dataFile.open('w');
        dataFile.write(JSON.stringify(data));
        dataFile.close();

        $.createPreview(document, baseDirectory);
        if (app.dialogs.length > 0) {
            app.dialogs.everyItem().destroy();
        }

        var baseFile = new File(baseDirectory);
        app.packageUCF(baseFile.fsName, baseFile.fsName + '.zip', 'application/zip');

        return baseFile.fsName + '.zip';
    }

    $.build = function() {
        var baseDirectory = app.activeDocument.filePath + '/';
        $.filePath = baseDirectory + app.activeDocument.name;
        var ext = app.activeDocument.name.split('.').pop();
        $.baseDirectory = baseDirectory + app.activeDocument.name.replace("." + ext, '');

        $.createExportFolder();
        
        baseDirectory = $.baseDirectory;
        var filePath = $.filePath;
            
        var templateFile = new File(filePath);
        templateFile.open("r");
            
        var document = app.activeDocument;
            
        $.uuid = $.getDocumentID(document);
        var response = {
            pages: []
        };

        var pages = $.savedSettings.pages;
        var initialPageIndex = 0;
        var lastPageIndex = document.pages.length;
        var totalOfPages = document.pages.length;

        if(!!pages) {
            var results = /^([0-9]+)(-)+([0-9]+)$/.exec(pages)
            if(results === null) {
                throw new Error('The range for pages has an invalid syntax');
            }

            var lowerRange = parseInt(results[1]);
            var higherRange = parseInt(results[3]);

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

            initialPageIndex = lowerRange - 1;
            lastPageIndex = higherRange;
            
            if (higherRange > totalOfPages) {
                lastPageIndex = totalOfPages
            }
        }

        // This set the document to pixels
        app.activeDocument.viewPreferences.horizontalMeasurementUnits = 2054187384;
        app.activeDocument.viewPreferences.verticalMeasurementUnits = 2054187384;

        for (var i = initialPageIndex; i < lastPageIndex; i++) {
            var page = document.pages[i];
            var position = $.getItemPosition(page.bounds);
            var pageData = {
                x: position.x,
                y: position.y,
                width: position.width,
                height: position.height,
                items: []
            };
            $.getTextFrames(page, pageData.items);
            $.getImages(page, pageData.items, baseDirectory);
            response.pages.push(pageData);
        }

        return $.buildZipFile(document, response, baseDirectory);
    }
}

var settingsFilePath = "~/canvaflow_settings.json";
var cfBuild = new CanvasflowBuild(settingsFilePath);
cfBuild.build();