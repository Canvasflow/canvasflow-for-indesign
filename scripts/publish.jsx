//@include "json2.js"
//@include "api.js"
var host = "http://api.cflowdev.com/v2";
var settingsFilePath = "~/canvaflow_settings.json";

var CanvasflowPublish = function(settingsPath, host) {
    var $ = this;
    $.baseDirectory = '';
    $.filePath = '';
    $.uuid = '';
    $.host = host;
    $.canvasflowApi = null;
    $.dialog = {};

    $.settingsPath = settingsPath;
    $.writeResizeScript = function(path, inputImage, outputImage) {
        var nl = "\u000A";
        var cmd = ""; //"#!/bin/bash" + nl;
        cmd = cmd + "echo \"" + inputImage + "\" && ";
        cmd = cmd + "echo \"" + outputImage + "\" && ";
        cmd = cmd + "touch x.txt"

        var file = new File(path);
        if(file.exists) {
            file.remove();
        }

        file.encoding = 'UTF-8';
        file.open('w');
        file.write(cmd);
        file.close();
    }

    $.runResizeScript = function(path) {
        var file = new File(path);
        file.execute();
        // file.remove();
    }

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

    $.getUUID = function(){
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });

        return uuid.substring(0, uuid.length / 2);
    }

    $.getSubstrings = function(characters) {
        var data = [];
        var substring = null;
        for(var i = 0; i<characters.length; i++) {
            var character = characters.item(i);
            if(substring == null) {
                substring = {
                    content: character.contents,
                    font: {
                        fontFamily: character.appliedFont.fontFamily,
                        fontSize: character.pointSize,
                        fontStyle: character.appliedFont.fontStyleName || 'Regular'
                    }
                }
                continue;
            }

            var previousFontFamily = substring.font.fontFamily;
            var previousFontSize = substring.font.fontFamily;
            var previousFontStyle = substring.font.fontStyle;
            var currentFontFamily = character.appliedFont.fontFamily;
            var currentFontSize = character.appliedFont.fontFamily;
            var currentFontStyle = character.appliedFont.fontStyleName || 'Regular';
            // if((previousFontFamily !== currentFontFamily) || (previousFontSize !== currentFontSize)) {
            if(previousFontStyle !== currentFontStyle) {    
                data.push(substring);
                substring = {
                    content: character.contents,
                    font: {
                        fontFamily: character.appliedFont.fontFamily,
                        fontSize: character.pointSize,
                        fontStyle: character.appliedFont.fontStyleName || 'Regular'
                    }
                }

                continue;
            }

            substring.content = substring.content + character.contents;
        }

        if(substring !== null) {
            data.push(substring);
        }

        return data;
    }

    $.getParagraphs = function(paragraphs) {
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
                substrings: $.getSubstrings(paragraph.characters),
                characterStyle: characterStyle,
                paragraphStyle: {
                    fontFamily: paragraph.appliedParagraphStyle.appliedFont.fontFamily,
                    fontSize: paragraph.appliedParagraphStyle.pointSize
                }
            });
        }
    
        return response;
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
                data.push({
                    type: "TextFrame",
                    id: textFrame.id,
                    content: textFrame.contents,
                    width: position.width,
                    height: position.height,
                    font: $.getFontFromParagraphs(textFrame),
                    paragraphs: $.getParagraphs(textFrame.paragraphs),
                    position: {
                        x: position.x,
                        y: position.y
                    }
                });
            }
        }
    }

    $.exportImageRepresentation = function(image, ext, imageDirectory, id) {
        if(ext === 'jpg' || ext === 'jpeg') {
            ext = 'jpeg';
        } else {
            ext = 'png';
        }

        var destFilePath = imageDirectory + '/' + id + '.' + ext;

        image.exportFile(ext, File(destFilePath)); 

        return './images/' + id + '.' + ext;
    }

    $.imageNeedsResizing = function() {
        
    }

    $.saveImageToFile = function(item, imageDirectory) {
        var images = item.images;
        var id = item.id;
        for(var i = 0; i < images.length; i++) {
            var image = images[i];
            var linkPath = image.itemLink.filePath;
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
                    return $.exportImageRepresentation(image, ext, imageDirectory, id);
                }
            } else {
                return $.exportImageRepresentation(image, ext, imageDirectory, id);
            }
            return './images/' + id + '.' + ext;
        }
    
        return '';
    }

    $.checkIfImageExist = function(item) {
        var images = item.images;
        for(var i = 0; i < images.length; i++) {
            var image = images[i];
            var linkPath = image.itemLink.filePath;
            var originalImageFile = File(linkPath);
            return originalImageFile.exists;
        }

        return false;
    }

    

    $.getImageFromItem = function(items, data, baseDirectory) {
        var imageDirectory = baseDirectory + '/images';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var images = item.images;
            if (images.length > 0) {
                var imagePath;
                var position = $.getItemPosition(item.geometricBounds);
                var imageExist = $.checkIfImageExist(item);
                if(imageExist) {
                    imagePath = $.saveImageToFile(item, imageDirectory);
                    data.push({
                        type: "Image",
                        id: item.id,
                        content: imagePath,
                        width: position.width,
                        height: position.height,
                        position: {
                            x: position.x,
                            y: position.y
                        }
                    });
                } else {
                    if($.savedSettings.previewImage) {
                        imagePath = $.saveImageToFile(item, imageDirectory);
                        data.push({
                            type: "Image",
                            id: item.id,
                            content: imagePath,
                            width: position.width,
                            height: position.height,
                            position: {
                                x: position.x,
                                y: position.y
                            }
                        });
                    } else {
                        alert('The image do not exist and preview is false');
                    }
                }
            }
        }
    }

    $.checkIfGraphicImageExist = function(graphic) {
        var linkPath = graphic.itemLink.filePath;
        var originalImageFile = File(linkPath);
        return originalImageFile.exists;
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
        return './images/' + id + '.' + ext;
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

    $.isUniquePreview = function() {
        var name = app.activeDocument.pages.item(0).name;
        for(var i=1; i < app.activeDocument.pages.length; i++) {
            if(app.activeDocument.pages.item(i).name === name) {
                return false;
            }
        }
        return true
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

    $.uploadZip = function(filepath) {
        var conn = new Socket;
    
        var reply = "";
        var host = $.host + ":80"
    
        var f = File ( filepath);
        var filename = f.name
        f.encoding = 'BINARY';
        f.open("r");
        var fContent = f.read();
        f.close();

        var articleName = f.displayName.replace('.zip', '');
    
        apiKey = $.savedSettings.apiKey;
        var PublicationID = $.savedSettings.PublicationID;
        var IssueID = $.savedSettings.IssueID;
        var StyleID = $.savedSettings.StyleID;
    
        if(conn.open(host, "BINARY")) {
            conn.timeout=20000;
    
            var boundary = Math.random().toString().substr(2);
    
            var fileContent = "--" + boundary + "\r\n"
            + "Content-Disposition: form-data; name=\"contentFile\"; filename=\"" + filename +"\"\r\n"
            + "Content-Type: application/octet-stream\r\n"
            + "\r\n"
            + fContent
            + "\r\n";
    
            var apiKeyContent = "--" + boundary + "\r\n"
            + "Content-Disposition: form-data; name=\"secretKey\"\r\n"
            + "\r\n"
            + apiKey + "\r\n"
            + "\r\n";

            var articleNameContent = "--" + boundary + "\r\n"
            + "Content-Disposition: form-data; name=\"articleName\"\r\n"
            + "\r\n"
            + articleName + "\r\n"
            + "\r\n";
    
            var PublicationIDContent = "--" + boundary + "\r\n"
            + "Content-Disposition: form-data; name=\"publicationId\"\r\n"
            + "\r\n"
            + PublicationID + "\r\n"
            + "\r\n";
    
            var IssueIDContent = "--" + boundary + "\r\n"
            + "Content-Disposition: form-data; name=\"issueId\"\r\n"
            + "\r\n"
            + IssueID + "\r\n"
            + "\r\n";
    
            var StyleIDContent = "--" + boundary + "\r\n"
            + "Content-Disposition: form-data; name=\"styleId\"\r\n"
            + "\r\n"
            + StyleID + "\r\n"
            + "\r\n";
    
            var contentType = "--" + boundary + "\r\n"
            + "Content-Disposition: form-data; name=\"contentType\"\r\n"
            + "\r\n"
            + "indesign" + "\r\n"
            + "\r\n";
    
            var articleIdContent = "--" + boundary + "\r\n"
            + "Content-Disposition: form-data; name=\"articleId\"\r\n"
            + "\r\n"
            + $.uuid + "\r\n"
            // + "xxxxxxx" + "\r\n"
            + "\r\n";
    
            var content = fileContent
            + apiKeyContent
            + articleNameContent
            + contentType
            + PublicationIDContent
            + IssueIDContent
            + StyleIDContent
            + articleIdContent
            + "--" + boundary + "--\r\n\r";
    
            var cs = "POST /v1/index.cfm?endpoint=/article HTTP/1.1\r\n"
            + "Content-Length: " + content.length + "\r\n"
            + "Content-Type: multipart/form-data; boundary=" + boundary + "\r\n" 
            + "Host: "+ host + "\r\n"
            + "Authorization: " + apiKey + "\r\n"
            + "Accept: */*\r\n"
            + "\r\n"
            + content;
    
            conn.write( cs );
    
            reply = conn.read();
            conn.close();
    
            if( reply.indexOf( "200" ) > 0 ) {
                var data = reply.substring(reply.indexOf("{"), reply.length);
                
                // var response = JSON.parse(data);
                return true;
            } else {
                return false;
            }
        } else {
            alert("I couldn't connect to the server");
            return false;
        }
    }

    $.cleanUp = function() {
        var baseDirectory = $.baseDirectory;
        var dataPath = baseDirectory + '/data.json'; 
        new File(dataPath).remove();
        var previewPath = baseDirectory + '/preview.jpg'; 
        new File(previewPath).remove();
    
        var imagesPath = baseDirectory + '/images';
        var imagesFolder = new Folder(imagesPath);
        var files = imagesFolder.getFiles();
        for(var i =0; i < files.length; i++) {
            var item = files[i];
            item.remove();
        }
        imagesFolder.remove();
    
        new Folder(baseDirectory).remove();
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

    $.getUUIDFromDocument = function(doc) {
        var label = doc.extractLabel('CANVASFLOW-ID');
        if(!!label) {
            return label;
        }
        return '';
    }

    $.getDocumentID = function(doc) {
        var uuid = $.getUUIDFromDocument(doc);
        if(!uuid) {
            uuid = $.getUUID();
            doc.insertLabel("CANVASFLOW-ID", uuid);
        }

        return uuid;
    }

    $.build = function() {
        var baseDirectory = app.activeDocument.filePath + '/';
        $.filePath = baseDirectory + app.activeDocument.name;
        var ext = app.activeDocument.name.split('.').pop();
        $.baseDirectory = baseDirectory + app.activeDocument.name.replace("." + ext, '');
        // $.writeResizeScript($.baseDirectory + '/resize.sh', '/input/image', '/output/image');
        // $.runResizeScript('/Users/jjzcru/Desktop/test.sh');
        $.createExportFolder();
        
        baseDirectory = $.baseDirectory;
        var filePath = $.filePath;
            
        var templateFile = new File(filePath);
        templateFile.open("r");
            
        var document = app.activeDocument;
            
        $.uuid = $.getDocumentID(document);
        var data = [];

        for (var i = 0; i < document.pages.length; i++) {
            var page = document.pages[i];
            $.getTextFrames(page, data);
            $.getImages(page, data, baseDirectory);
        }

        return $.buildZipFile(document, data, baseDirectory);
    }

    $.getPublication = function() {
        var apiKey = $.savedSettings.apiKey;
        var PublicationID = $.savedSettings.PublicationID;

        var publications = JSON.parse($.canvasflowApi.getPublications(apiKey));
        for(var i=0; i < publications.length; i++) {
            var publication = publications[i];
            if(publication.id == PublicationID) {
                return publication;
            }
        }
        return null;
    }

    $.getIssue = function() {
        var apiKey = $.savedSettings.apiKey;
        var PublicationID = $.savedSettings.PublicationID;
        var IssueID = $.savedSettings.IssueID;

        var issues = JSON.parse($.canvasflowApi.getIssues(apiKey, PublicationID));
        for(var i=0; i < issues.length; i++) {
            var issue = issues[i];
            if(issue.id == IssueID) {
                return issue;
            }
        }
        return null;
    }

    $.getStyle = function() {
        var apiKey = $.savedSettings.apiKey;
        var PublicationID = $.savedSettings.PublicationID;
        var StyleID = $.savedSettings.StyleID;

        var styles = JSON.parse($.canvasflowApi.getStyles(apiKey, PublicationID));
        for(var i=0; i < styles.length; i++) {
            var style = styles[i];
            if(style.id == StyleID) {
                return style;
            }
        }
        return null;
    }

    $.displayConfirmDialog = function(onPublish, onCancel) {
        
        var dialog = new Window('dialog', 'Publish', undefined, {closeButton: false});
        dialog.orientation = 'column';
        dialog.alignment = 'right';
        dialog.preferredSize = [300,100];

        var valuesWidth = 200;
        var labelWidth = 150;

        var endpoint = $.savedSettings.endpoint;

        $.canvasflowApi = new CanvasflowApi('http://' + endpoint + '/v2');

        // Intro
        var intro = 'You are about to publish the current article to Canvasflow.  Please confirm the following details are correct.';
        dialog.introGroup = dialog.add('statictext', [0, 0, valuesWidth * 1.5, 50], intro, {multiline: true});
        dialog.introGroup.orientation = 'row:top';
        dialog.introGroup.alignment = 'left';

        // Publication
        var publication = $.getPublication();
        dialog.publicationGroup = dialog.add('group');
        dialog.publicationGroup.orientation = 'row';
        dialog.publicationGroup.add('statictext', [0, 0, labelWidth, 20], "Publication");
        dialog.publicationGroup.add('statictext', [0, 0, labelWidth, 20], publication.name);

        // Issue
        if(publication.type === 'issue') {
            var issue = $.getIssue();
            dialog.issueGroup = dialog.add('group');
            dialog.issueGroup.orientation = 'row';
            dialog.issueGroup.add('statictext', [0, 0, labelWidth, 20], "Issue");
            dialog.issueGroup.add('statictext', [0, 0, labelWidth, 20], issue.name);
        }
        
        // Style
        var style = $.getStyle();
        dialog.styleGroup = dialog.add('group');
        dialog.styleGroup.orientation = 'row';
        dialog.styleGroup.add('statictext', [0, 0, labelWidth, 20], "Style");
        dialog.styleGroup.add('statictext', [0, 0, labelWidth, 20], style.name);

        dialog.buttonsBarGroup = dialog.add('group');
        dialog.buttonsBarGroup.orientation = 'row';
        dialog.buttonsBarGroup.alignChildren = 'bottom';    
        dialog.buttonsBarGroup.cancelBtn = dialog.buttonsBarGroup.add('button', undefined, 'Cancel');
        dialog.buttonsBarGroup.saveBtn = dialog.buttonsBarGroup.add('button', undefined, 'OK');

        dialog.buttonsBarGroup.saveBtn.onClick = function() {
            try {
                dialog.active = false;
                dialog.hide();
                dialog.close(0);
                onPublish();
            }catch(e) {
                alert('Error: ' + e.message);
            }
        }

        dialog.buttonsBarGroup.cancelBtn.onClick = function() {
            dialog.close(0);
            onCancel();
        }
        
        $.dialogSUI = dialog.show();
        return;
    }

    $.publish = function() {
        if (app.documents.length != 0){
            var zipFilePath = '';
            try {
                zipFilePath = $.build();
            } catch(e) {
                alert(e.message);
                return;
            }

            var onPublish = function() {
                try {
                    if($.uploadZip(zipFilePath)) {
                        $.cleanUp();
                        new File(zipFilePath).remove()
                        alert('Article was uploaded successfully');
                    } else {
                        throw new Error('Error uploading the content, please try again');
                    }
                } catch(e) {
                    alert(e.message);
                }
            }
            
            var onCancel = function() {
                $.cleanUp();
                new File(zipFilePath).remove();
            }
            
            // onPublish();
            $.displayConfirmDialog(onPublish, onCancel);
        }
        else{
            alert ("Please open a document.");
        }
    }
}

var cfPublish = new CanvasflowPublish(settingsFilePath, "api.cflowdev.com");
cfPublish.publish();