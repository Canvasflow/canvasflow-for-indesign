#targetengine "session"  

if (typeof JSON !== "object") {
    JSON = {};
}

(function () {
    "use strict";

    var rx_one = /^[\],:{}\s]*$/;
    var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
    var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) {
        return (n < 10)
            ? "0" + n
            : n;
    }

    function this_value() {
        return this.valueOf();
    }

    if (typeof Date.prototype.toJSON !== "function") {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? (
                    this.getUTCFullYear()
                    + "-"
                    + f(this.getUTCMonth() + 1)
                    + "-"
                    + f(this.getUTCDate())
                    + "T"
                    + f(this.getUTCHours())
                    + ":"
                    + f(this.getUTCMinutes())
                    + ":"
                    + f(this.getUTCSeconds())
                    + "Z"
                )
                : null;
        };

        Boolean.prototype.toJSON = this_value;
        Number.prototype.toJSON = this_value;
        String.prototype.toJSON = this_value;
    }

    var gap;
    var indent;
    var meta;
    var rep;


    function quote(string) {
        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string)
            ? "\"" + string.replace(rx_escapable, function (a) {
                var c = meta[a];
                return typeof c === "string"
                    ? c
                    : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
            }) + "\""
            : "\"" + string + "\"";
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i;          // The loop counter.
        var k;          // The member key.
        var v;          // The member value.
        var length;
        var mind = gap;
        var partial;
        var value = holder[key];
        if (
            value
            && typeof value === "object"
            && typeof value.toJSON === "function"
        ) {
            value = value.toJSON(key);
        }

        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }

        switch (typeof value) {
        case "string":
            return quote(value);

        case "number":

// JSON numbers must be finite. Encode non-finite numbers as null.

            return (isFinite(value))
                ? String(value)
                : "null";

        case "boolean":
        case "null":

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce "null". The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is "object", we might be dealing with an object or an array or
// null.

        case "object":

// Due to a specification blunder in ECMAScript, typeof null is "object",
// so watch out for that case.

            if (!value) {
                return "null";
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === "[object Array]") {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || "null";
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? "[]"
                    : gap
                        ? (
                            "[\n"
                            + gap
                            + partial.join(",\n" + gap)
                            + "\n"
                            + mind
                            + "]"
                        )
                        : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === "string") {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                (gap)
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                (gap)
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? "{}"
                : gap
                    ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
                    : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== "function") {
        meta = {    // table of character substitutions
            "\b": "\\b",
            "\t": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            "\"": "\\\"",
            "\\": "\\\\"
        };
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = "";
            indent = "";

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === "string") {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== "function" && (
                typeof replacer !== "object"
                || typeof replacer.length !== "number"
            )) {
                throw new Error("JSON.stringify");
            }

// Make a fake root object containing our value under the key of "".
// Return the result of stringifying the value.

            return str("", {"": value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== "function") {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k;
                var v;
                var value = holder[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            rx_dangerous.lastIndex = 0;
            if (rx_dangerous.test(text)) {
                text = text.replace(rx_dangerous, function (a) {
                    return (
                        "\\u"
                        + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
                    );
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with "()" and "new"
// because they can cause invocation, and "=" because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with "@" (a non-JSON character). Second, we
// replace all simple value tokens with "]" characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or "]" or
// "," or ":" or "{" or "}". If that is so, then the text is safe for eval.

            if (
                rx_one.test(
                    text
                        .replace(rx_two, "@")
                        .replace(rx_three, "]")
                        .replace(rx_four, "")
                )
            ) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The "{" operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval("(" + text + ")");

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return (typeof reviver === "function")
                    ? walk({"": j}, "")
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError("JSON.parse");
        };
    }
}());
      
// app.menus.item("$ID/Main").submenus.item("Canvasflow").remove();
var apiKeySetting = 1;
var canvasflowSettingsKey = "CanvasflowSettings";

install();
function install() {
    try {
        app.menus.item("$ID/Main").submenus.item("Canvasflow").remove();
    } catch(e) {

    }

    var canvasflowScriptActionSettings = app.scriptMenuActions.add("Settings");  
    canvasflowScriptActionSettings.eventListeners.add("onInvoke", function() {  
        createSettings()
    }); 
    
    var canvasflowScriptActionPublish = app.scriptMenuActions.add("Publish");  
    canvasflowScriptActionPublish.eventListeners.add("onInvoke", function() {  
        publishArticle();
    });  

    var canvasflowScriptMenu = null;
    try {  
        canvasflowScriptMenu = app.menus.item("$ID/Main").submenus.item("Canvasflow");  
        canvasflowScriptMenu.title;  
    } catch (e) {  
        canvasflowScriptMenu = app.menus.item("$ID/Main").submenus.add("Canvasflow");  
    }  

    canvasflowScriptMenu.menuItems.add(canvasflowScriptActionSettings);
    canvasflowScriptMenu.menuItems.add(canvasflowScriptActionPublish);
}

function createSettings() {
    var settingsDialog = new Window('dialog', 'Settings');
    settingsDialog.orientation = 'column';
    settingsDialog.alignment = 'right';
    settingsDialog.preferredSize = [130,100];

    //Add Api Key
    settingsDialog.apiKeyGroup = settingsDialog.add('group');
    settingsDialog.apiKeyGroup.orientation = 'row';
    settingsDialog.apiKeyGroup.add('statictext', [0, 0, 100, 20], "Api Key");
    var savedApiKey = getApiKey();
    settingsDialog.apiKeyGroup.apiKey = settingsDialog.apiKeyGroup.add('edittext', [0, 0, 120, 20], savedApiKey)
    
    //Add Publication list
    settingsDialog.publicationDropDownGroup = settingsDialog.add('group');
    settingsDialog.publicationDropDownGroup.orientation = 'row';
    settingsDialog.publicationDropDownGroup.add('statictext', [0, 0, 100, 20], "Publications");
    var publications = ["Apple", "Test", "New publication"];
    settingsDialog.publicationDropDownGroup.dropDown = settingsDialog.publicationDropDownGroup.add('dropdownlist', [0, 0, 120, 20], undefined, {items:publications})
    settingsDialog.publicationDropDownGroup.dropDown.selection = 1;

    // Panel buttons
    settingsDialog.buttonsBarGroup = settingsDialog.add('group');
    settingsDialog.buttonsBarGroup.orientation = 'row';
    settingsDialog.buttonsBarGroup.cancelBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'Cancel');
    settingsDialog.buttonsBarGroup.saveBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'OK');
    

    settingsDialog.buttonsBarGroup.saveBtn.onClick = function() {
        var selectedPublication = settingsDialog.publicationDropDownGroup.dropDown.selection;
        var apiKey = settingsDialog.apiKeyGroup.apiKey.text;
        saveToFile(apiKey);
        settingsDialog.destroy();
    }

    settingsDialog.buttonsBarGroup.cancelBtn.onClick = function() {
        settingsDialog.destroy();
    }
    settingsDialog.show();

    /*dialog = app.dialogs.add({name:"Settings"});
    with(dialog){
        with(dialogColumns.add()){
            with (dialogColumns.add()){
                staticTexts.add({staticLabel:"Api Key:", minWidth:50});
            }
            with (dialogColumns.add()){
                var apiKeyEditbox = textEditboxes.add({minWidth:200});
                apiKeyEditbox.editContents = getApiKey();
            }
        }
    }

    var myReturn = dialog.show();
    if (myReturn == true){
        var apiKey = apiKeyEditbox.editContents;
        saveToFile(apiKey);
        dialog.destroy();
    } else {
        dialog.destroy();
    }*/	
}

function publishArticle(){
    if (app.documents.length != 0){	
        var baseDirectory = app.activeDocument.filePath + '/';
        var filePath = baseDirectory + app.activeDocument.name;
        var ext = app.activeDocument.name.split('.').pop();
        baseDirectory = baseDirectory + app.activeDocument.name.replace("." + ext, '');
        createExportFolder(baseDirectory);

        var apiKey = getApiKey();
        run(filePath, baseDirectory, apiKey);
        saveToFile(apiKey);		
	}
	else{
		alert ("Please open a document.");
	}
}

function createExportFolder(folderPath) {
    var f = new Folder(folderPath);
    if (f.exists) {
        f.remove()
    }

    f.create()
    var imageDirectory = new Folder(folderPath + '/images');
    imageDirectory.create();
}

function sendTheFile(baseDirectory, filePath) {
    var apiKey = getApiKey();
    run(filePath, baseDirectory, apiKey);
}

function run(filePath, baseDirectory, apiKey) {
    var templateFile = new File(filePath);
    templateFile.open("r");

    var document = app.open(templateFile);
    var data = [];

    for (var i = 0; i < document.pages.length; i++) {
        var page = document.pages[i];
        getTextFrames(page, data);
        getImages(page, data, baseDirectory);
    }

    save(document, data, baseDirectory, apiKey);
}

function saveToFile(apiKey) {
    var file = new File('~/canvaflow_api_key.txt');
    file.encoding = 'UTF-8';
    file.open('w');
    file.write(apiKey);
    file.close();
}

function getApiKey(){
    var file = new File('~/canvaflow_api_key.txt');
    if(file.exists) {
        file.open('r');
        return file.read();
    } else {
        var file = new File('~/canvaflow_api_key.txt');
        file.encoding = 'UTF-8';
        file.open('w');
        file.write('');
        file.close();
    }
    return '';
}

function getTextFrames(page, data) {
    var textFrames = page.textFrames;
    for (var i = 0; i < textFrames.length; i++) {
        var textFrame = textFrames[i];
        var position = getItemPosition(textFrame.geometricBounds);
        data.push({
            type: "TextFrame",
            id: textFrame.id,
            content: textFrame.contents,
            width: position.width,
            height: position.height,
            font: getFontStyle(textFrame.paragraphs),
            position: {
                x: position.x,
                y: position.y
            }
        });
    }
}

function getFontStyle(paragraphs) {
    var response;
    for(var i=0; i < paragraphs.count(); i++) {
        var paragraph = paragraphs[i];
        response = {
            fontFamily: paragraph.appliedParagraphStyle.appliedFont.fontFamily,
            fontSize: paragraph.appliedParagraphStyle.pointSize
        }
    }

    return response;
}

function getImages(page, data, baseDirectory) {
    getImageFromItem(page.rectangles, data, baseDirectory);
    getImageFromItem(page.ovals, data, baseDirectory);
    getImageFromItem(page.graphicLines, data, baseDirectory);
    getImageFromItem(page.multiStateObjects, data, baseDirectory);
    getImageFromItem(page.polygons, data, baseDirectory);
}

function getImageFromItem(items, data, baseDirectory) {
    var imageDirectory = baseDirectory + '/images';
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var images = item.images;
        if (images.length > 0) {
            var imagePath = saveImageToFile(item, imageDirectory);
            var position = getItemPosition(item.geometricBounds);
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

function saveImageToFile(item, imageDirectory) {
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

function getItemPosition(bounds) {
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

function save(document, data, baseDirectory, apiKey) {
    var output = baseDirectory + '/data.json'; 
    var dataFile = new File(output);
    if(dataFile.exists) {
        dataFile.remove();
    }
    dataFile.encoding = 'UTF-8';
    dataFile.open('w');
    dataFile.write(JSON.stringify(data));
    dataFile.close();

    createPreview(document, baseDirectory);

    var baseFile = new File(baseDirectory);
    app.packageUCF(baseFile.fsName, baseFile.fsName + '.zip', 'application/zip');
    if(uploadZip(baseFile.fsName + '.zip', apiKey)) {
        cleanUp(baseDirectory);
        alert('Article was uploaded successfully');
    } else {
        alert("Error uploading the content, please try again")
    }
}

function cleanUp(baseDirectory) {
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

function createPreview(document, baseDirectory) {
    var imagePath = baseDirectory + '/preview.jpg';
    if(imagePath.exists) {
        imagePath.remove();
    }
    document.exportFile(ExportFormat.JPG, new File(imagePath));
}

function uploadZip(filepath, apiKey) {
    var conn = new Socket;

    var reply = "";
    var host = "127.0.0.1:3000"

    var f = File ( filepath);
    var filename = f.name
    f.encoding = 'BINARY';
    f.open("r");
    var fContent = f.read();
    f.close();


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

        var contentType = "--" + boundary + "\r\n"
        + "Content-Disposition: form-data; name=\"contentType\"\r\n"
        + "\r\n"
        + "indesign" + "\r\n"
        + "\r\n";

        var content = fileContent
        + apiKeyContent
        + contentType
        + "--" + boundary + "--\r\n\r";

        var cs = "POST /upload HTTP/1.1\r\n"
        + "Content-Length: " + content.length + "\r\n"
        + "Content-Type: multipart/form-data; boundary=" + boundary + "\r\n" 
        + "Host: "+ host + "\r\n"
        + "Authorization: " + apiKey + "\r\n"
        + "Accept: */*\r\n"
        + "\r\n"
        + content;

        conn.write( cs );

        reply = conn.read(999999);
        conn.close();
        if( reply.indexOf( "200 OK" ) > 0 ) {
            var data = reply.substring(reply.indexOf("{"), reply.length);
            
            var response = JSON.parse(data);

            alert(response.success);
            return true;
        } else {
            return false;
        }
    } else {
        alert("I couldn't connect to the server");
        return false;
    }
}