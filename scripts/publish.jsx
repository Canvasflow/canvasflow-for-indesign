//@include "json2.js"
//@include "api.js"
var host = "http://api.cflowdev.com/v1/index.cfm";
var settingsFilePath = "~/canvaflow_settings.json";

var CanvasflowPublish = function(settingsPath, host) {
    var $ = this;
    $.baseDirectory = '';
    $.filePath = '';
    $.uuid = '';
    $.host = host;

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

    $.getUUID = function(){
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });

        return uuid.substring(0, uuid.length / 2);
    }

    $.getParagraphs = function(paragraphs) {
        var response = [];
        for(var i=0; i < paragraphs.count(); i++) {
            var paragraph = paragraphs.item(i);
            if(paragraph.contents === '\r') {
                continue
            }

            response.push({
                content: paragraph.contents,
                font: {
                    fontFamily: paragraph.appliedFont.fontFamily,
                    fontSize: paragraph.pointSize,
                },
                style: {
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

    $.getTextFrames = function(page, data) {
        var textFrames = page.textFrames;
        for (var i = 0; i < textFrames.length; i++) {
            var textFrame = textFrames[i];
            var position = $.getItemPosition(textFrame.geometricBounds);
            if(!!textFrame.contents) {
                data.push({
                    type: "TextFrame",
                    id: textFrame.id,
                    content: textFrame.contents,
                    width: position.width,
                    height: position.height,
                    font: {
                        fontFamily: textFrame.appliedObjectStyle.appliedParagraphStyle.appliedFont.fontFamily,
                        fontSize: textFrame.appliedObjectStyle.appliedParagraphStyle.pointSize
                    },
                    paragraphs: $.getParagraphs(textFrame.paragraphs),
                    position: {
                        x: position.x,
                        y: position.y
                    }
                });
            }
        }
    }

    $.saveImageToFile = function(item, imageDirectory) {
        var images = item.images;
        var id = item.id;
        for(var i = 0; i < images.length; i++) {
            var image = images[i];
            var linkPath = image.itemLink.filePath;
            var originalImageFile = File(linkPath);
            var fileName = originalImageFile.fsName; 
            var ext = fileName.split('.').pop();
    
            var destFilePath = imageDirectory + '/' + id + '.' + ext;
    
            originalImageFile.copy(destFilePath);
            return './images/' + id + '.' + ext;
        }
    
        return "";
    }

    $.getImageFromItem = function(items, data, baseDirectory) {
        var imageDirectory = baseDirectory + '/images';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var images = item.images;
            if (images.length > 0) {
                var imagePath = $.saveImageToFile(item, imageDirectory);
                var position = $.getItemPosition(item.geometricBounds);
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
            }
        }
    }

    $.getImages = function(page, data, baseDirectory) {
        $.getImageFromItem(page.rectangles, data, baseDirectory);
        $.getImageFromItem(page.ovals, data, baseDirectory);
        $.getImageFromItem(page.graphicLines, data, baseDirectory);
        $.getImageFromItem(page.multiStateObjects, data, baseDirectory);
        $.getImageFromItem(page.polygons, data, baseDirectory);
    }

    $.createPreview = function(document, baseDirectory) {
        var imagePath = baseDirectory + '/preview.jpg';
        if(imagePath.exists) {
            imagePath.remove();
        }
        try {
            app.jpegExportPreferences.pageString = "1";  
            app.jpegExportPreferences.jpegExportRange = ExportRangeOrAllPages.EXPORT_RANGE; 
            document.exportFile(ExportFormat.JPG, new File(imagePath));
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
    
            var cs = "POST /v1/index.cfm/article HTTP/1.1\r\n"
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

            alert(reply);
    
            if( reply.indexOf( "200" ) > 0 ) {
                var data = reply.substring(reply.indexOf("{"), reply.length);
                
                var response = JSON.parse(data);
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
    
        new Folder(baseDirectory).remove()
    }

    $.upload = function(document, data, baseDirectory) {
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
    
        var baseFile = new File(baseDirectory);
        app.packageUCF(baseFile.fsName, baseFile.fsName + '.zip', 'application/zip');
        alert('Article was uploaded successfully');

        /*if($.uploadZip(baseFile.fsName + '.zip')) {
            $.cleanUp();
            alert('Article was uploaded successfully');
        } else {
            alert("Error uploading the content, please try again")
        }*/
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

    $.process = function() {
        var baseDirectory = $.baseDirectory;
        var filePath = $.filePath;

        var templateFile = new File(filePath);
        templateFile.open("r");

        var document = app.open(templateFile);
        $.uuid = $.getDocumentID(document);
        // alert($.uuid);
        
        var data = [];

        for (var i = 0; i < document.pages.length; i++) {
            var page = document.pages[i];
            $.getTextFrames(page, data);
            $.getImages(page, data, baseDirectory);
        }

        $.upload(document, data, baseDirectory);
    }

    

    $.publish = function() {
        if (app.documents.length != 0){	
            var baseDirectory = app.activeDocument.filePath + '/';
            $.filePath = baseDirectory + app.activeDocument.name;
            var ext = app.activeDocument.name.split('.').pop();
            $.baseDirectory = baseDirectory + app.activeDocument.name.replace("." + ext, '');
            $.createExportFolder();
    
            $.process();
        }
        else{
            alert ("Please open a document.");
        }
    }
}

var cfPublish = new CanvasflowPublish(settingsFilePath, "api.cflowdev.com");
cfPublish.publish();