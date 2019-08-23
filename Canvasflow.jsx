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
var isInternal = true;
var canvasflowSettingsKey = "CanvasflowSettings";
var settingsFilePath = "~/canvaflow_settings.json";
var commandFilePath = "~/canvasflow_runner.command";

var defaultHost = 'api.canvasflow.io';
var logFilePath = "~/canvaflow_debug_log.log";
var logger;
var isDebugEnable = true;

setTimeout = function(func, time) {
    $.sleep(time);
    func();
};

var CanvasflowLogger = function(logFilePath, enable) {
    var $ = this;
    $.logFilePath = logFilePath;
    $.enable = enable;

    $.createFile = function() {
        var file = new File($.logFilePath);
        if(file.exists) {
            file.open('r');
            file.remove();
        }

        if($.enable) {
            var file = new File($.logFilePath);
            file.encoding = 'UTF-8';
            file.open('w');
            file.write('');
            file.close();
        }
    }

    $.log = function(ms, name) {
        if($.enable) {
            var file = new File($.logFilePath);
            file.encoding = 'UTF-8';
            file.open('a');
            file.write(ms + ' - ' + name + '\n');
            file.close();
        }
    }

    $.createFile();
}

var HTTPFile = function (url,port) {
    if (arguments.length == 1) {
        url = arguments[0];
        port = 80;
    };

    this.url = url;
    this.port = port;
    this.httpPrefix = this.url.match(/http:\/\//);
    this.domain = this.httpPrefix == null ? this.url.split("/")[0]+":"+this.port :this.url.split("/")[2]+":"+this.port;
    // this.call = "GET "+ (this.httpPrefix == null ? "http://"+this.url : this.url)+" HTTP/1.0\r\nHost:" +(this.httpPrefix == null ? this.url.split("/")[0] :this.url.split("/")[2])+"\r\nConnection: close\r\n\r\n";
    this.call = "GET "+ (this.httpPrefix == null ? "http://"+this.url : this.url)+" HTTP/1.0\r\nHost:" +(this.httpPrefix == null ? this.url.split("/")[0] :this.url.split("/")[2])+"\r\nAccept-encoding: gzip\r\nConnection: close\r\n\r\n";
    this.reply = new String();
    this.conn = new Socket();
    this.conn.encoding = "binary";

    HTTPFile.prototype.getResponse = function(f) {
        var typeMatch = this.url.match(/(\.)(\w{3,4}\b)/g);
        if (this.conn.open(this.domain,"binary")) {
            this.conn.write(this.call);
            this.reply = this.conn.read(9999999999);
            this.conn.close();
        } else {
            this.reply = "";
        }
        return this.reply.substr(this.reply.indexOf("\r\n\r\n")+4).toString();
    };
}

var CanvasflowApi = function (host) {
    this.host = host;

    CanvasflowApi.prototype.getPublications = function(apiKey) {
        var reply = new HTTPFile(this.host + "/publications?secretkey=" + apiKey);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.validate = function(apiKey) {
        var reply = new HTTPFile(this.host + "/info?secretkey=" + apiKey);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.getIssues = function(apiKey, PublicationID) {
        var reply = new HTTPFile(this.host + "/issues?secretkey=" + apiKey + "&publicationId=" + PublicationID);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.getStyles = function(apiKey, PublicationID) {
        var reply = new HTTPFile(this.host + "/styles?secretkey=" + apiKey + "&publicationId=" + PublicationID);
        return reply.getResponse();
    };
}

var CanvasflowBuild = function(settingsPath, commandFilePath) {
    var $ = this;

    $.settingsPath = settingsPath;
    $.commandFilePath = commandFilePath || '';
    $.imagesToResize = [];
    $.imagesToConvert = [];
    $.imageSizeCap = 5 * 1000000; // 5Mb

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
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (dt + Math.random()*16)%16 | 0;
                dt = Math.floor(dt/16);
                return (c=='x' ? r :(r&0x3|0x8)).toString(16);
            });
            uuid = uuid.substring(0, uuid.length / 2);
            doc.insertLabel("CANVASFLOW-ID", uuid);
        }

        return uuid;
    }

    $.getItemPosition = function(bounds) {
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
                    type: "TextFrame",
                    id: textFrame.id,
                    storyId: StoryID,
                    next: next,
                    previous: previous,
                    content: textFrame.contents,
                    width: position.width,
                    height: position.height,
                    font: $.getFontFromParagraphs(textFrame),
                    paragraphs: $.getParagraphs(textFrame.paragraphs, textFrame.id),
                    position: position
                });
            }
        }
    }

    $.checkIfGraphicImageExist = function(graphic) {
        var linkPath = graphic.itemLink.filePath;
        var originalImageFile = File(linkPath);
        return originalImageFile.exists;
    }

    $.exportImageRepresentation = function(image, imageDirectory, id) {
        var destFilePath = imageDirectory + '/' + id + '.jpg';
        destFilePath = destFilePath.replace(/%20/gi, ' ');

        try{
            image.exportFile(ExportFormat.JPG, new File(destFilePath)); 
        } catch(e) {
            alert('I failed trying to export this image: ' + destFilePath);
        }
        
        return '' + id + '.jpg';
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
            ext = 'jpg';
        }

        destFilePath = imageDirectory + '/' + id + '.' + ext;
        destFilePath = destFilePath.replace(/%20/gi, ' ');

        switch(ext) {
            case 'jpg':
            case 'jpeg':
            case 'tiff':
            case 'tif':       
            case 'png':
            case 'gif':
            case 'jp2':
            case 'pict':
            case 'bmp':
            case 'qtif':
            case 'psd':
            case 'sgi':
            case 'tga':        
                break;
            default:
                return $.exportImageRepresentation(graphic, imageDirectory, id);
        }

        if(!originalImageFile.exists) {
            return $.exportImageRepresentation(graphic, imageDirectory, id);
        }

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

        if(originalImageSize >= $.imageSizeCap) {
            $.imagesToResize.push(File(imageDirectory + '/' + id + '.' + ext).fsName);
            return '' + id + '.' + targetExt;
        }
        
        if(targetExt !== ext) {
            $.imagesToConvert.push(File(imageDirectory + '/' + id + '.' + ext).fsName);
        }

        ext = targetExt;
               
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
                                position: position
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
                                position: position
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


    $.resizeImages = function(imageFiles) {
        var dataFile = new File($.commandFilePath);
        var closeTerminalCommand = 'kill -9 $(ps -p $(ps -p $PPID -o ppid=) -o ppid=)';
    
        var files = [];
        for(var i = 0; i < imageFiles.length; i++) {
            files.push('"' + imageFiles[i] + '"');
        }
        dataFile.encoding = 'UTF-8';
        dataFile.open('w');
        dataFile.lineFeed = 'Unix';
        
        dataFile.writeln('clear');
        dataFile.writeln('files=( ' + files.join(' ') + ' )');
        dataFile.writeln('for file in "${files[@]}"');
        dataFile.writeln('\tdo :');
        dataFile.writeln('\t\text="${file#*.}"');
        dataFile.writeln('\t\tfilename=$(basename -- \"$file\")');
        dataFile.writeln('\t\tfilename="${filename%.*}"');
        dataFile.writeln('\t\timage_width="$({ sips -g pixelWidth \"$file\" || echo 0; } | tail -1 | sed \'s/[^0-9]*//g\')"');
        dataFile.writeln('\t\tif [ "$image_width" -gt "2048" ]; then');
        dataFile.writeln('\t\t\tparent_filename="$(dirname "${file})")"');
        dataFile.writeln('\t\t\ttarget_filename="${parent_filename}/${filename}.jpg"');
        dataFile.writeln('\t\t\tresize_command="sips -s formatOptions 1 --resampleWidth 2048 -s format jpeg \\\"${file}\\\" --out \\\"${target_filename}\\\"" ');
        dataFile.writeln('\t\t\teval $resize_command');
        dataFile.writeln('\t\tfi');
        dataFile.writeln('\t\tif [ $ext != "jpeg" ]; then');
        dataFile.writeln('\t\t\tremove_command="rm \\\"${file}\\\""');
        dataFile.writeln('\t\t\teval $remove_command');
        dataFile.writeln('\t\tfi');
        dataFile.writeln('done');
        // dataFile.writeln(closeTerminalCommand);
    
        dataFile.execute();
        dataFile.close();
    }

    $.convertImages = function(imageFiles) {
        var dataFile = new File($.commandFilePath);
        var closeTerminalCommand = 'kill -9 $(ps -p $(ps -p $PPID -o ppid=) -o ppid=)';

        var files = [];
        for(var i = 0; i < imageFiles.length; i++) {
            files.push('"' + imageFiles[i] + '"');
        }
        dataFile.encoding = 'UTF-8';
        dataFile.open('w');
        dataFile.lineFeed = 'Unix';
        
        dataFile.writeln('clear');
        dataFile.writeln('files=( ' + files.join(' ') + ' )');
        dataFile.writeln('for file in "${files[@]}"');
        dataFile.writeln('\tdo :');
        dataFile.writeln('\t\text="${file#*.}"');
        dataFile.writeln('\t\tfilename=$(basename -- \"$file\")');
        dataFile.writeln('\t\tfilename="${filename%.*}"');
        dataFile.writeln('\t\tparent_filename="$(dirname "${file})")"');
        dataFile.writeln('\t\ttarget_filename="${parent_filename}/${filename}.jpg"');
        dataFile.writeln('\t\tconvert_command="sips -s format jpeg \\\"${file}\\\" --out \\\"${target_filename}\\\""');
        dataFile.writeln('\t\teval $convert_command');
        dataFile.writeln('\t\tremove_command="rm \\\"${file}\\\""');
        dataFile.writeln('\t\teval $remove_command');
        dataFile.writeln('done');
        // dataFile.writeln(closeTerminalCommand);

        dataFile.execute();
        dataFile.close();
    }

    $.createPackage = function(baseFile) {
        try {
            app.packageUCF(baseFile.fsName, baseFile.fsName + '.zip', 'application/zip');
        } catch(e) {
            setTimeout(function() {
                $.createPackage(baseFile);
            }, 1000);
        }
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
        if(!!$.imagesToResize.length) {
            $.resizeImages($.imagesToResize);
        }
        if(!!$.imagesToConvert.length) {
            $.convertImages($.imagesToConvert);
        }

        setTimeout(function() {
            $.createPackage(baseFile);
            /*try {
                app.packageUCF(baseFile.fsName, baseFile.fsName + '.zip', 'application/zip');
            } catch(e) {
                alert('Error: ' + e.message);
            }*/
        }, 1000);

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
                id: page.id,
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

var CanvasflowDialog = function(settingsPath, internal) {
    var $ = this;
    $.settingsPath = settingsPath;
    $.isInternal = internal;
    $.defaultSavedSettings = '{"apiKey":"", "PublicationID": "", "IssueID": "", "StyleID": "", "endpoint": "", "previewImage": true, "pages": ""}';

    $.getSavedSettings = function() {
        var file = new File($.settingsPath);
        if(file.exists) {
            file.open('r');
            return JSON.parse(file.read());
        } else {
            var file = new File($.settingsPath);
            file.encoding = 'UTF-8';
            file.open('w');
            file.write($.defaultSavedSettings);
            file.close();

            $.getSavedSettings();
        }
    };

    $.savedSettings = $.getSavedSettings();

    $.getPublications = function(apiKey, canvasflowApi) {
        var reply = canvasflowApi.getPublications(apiKey);
        return JSON.parse(reply);
    };

    $.getIssues = function(apiKey, PublicationID, canvasflowApi) {
        var reply = canvasflowApi.getIssues(apiKey, PublicationID);
        return JSON.parse(reply);
    };

    $.getStyles = function(apiKey, PublicationID, canvasflowApi) {
        var reply = canvasflowApi.getStyles(apiKey, PublicationID);
        return JSON.parse(reply);
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
        for(var i = 0; i< items.length; i++) {
            if(items[i].id == id) {
                return items[i];
            }
        }
        return null;
    }

    $.mapItemsName = function(items) {
        var response = [];
        for(var i = 0; i< items.length; i++) {
            response.push(items[i].name);
        }
        return response;
    }

    $.resetFromEndpoint = function(endpoint) {
        var settings = {
            apiKey: '',
            previewImage: $.savedSettings.previewImage,
            PublicationID: '',
            IssueID: '',
            StyleID: '',
            endpoint: endpoint,
            pages: ''
        };

        $.save(settings);
    }

    $.resetFromApi = function(apiKey, canvasflowApi, endpoint) {
        var PublicationID = '';
        var IssueID = '';
        var StyleID = '';
        var previewImage = $.savedSettings.previewImage;
        var pages = $.savedSettings.pages || '';
        

        var publications = $.getPublications(apiKey, canvasflowApi);
        
        var publication = publications[0];
        PublicationID = publication.id;
        if(publication.type === 'issue') {
            var issues = $.getIssues(apiKey, PublicationID, canvasflowApi);
            var issue = issues[0];
            IssueID = issue.id;
        }

        var styles = $.getStyles(apiKey, PublicationID, canvasflowApi);
        var style = styles[0];
        StyleID = style.id;

        var settings = {
            apiKey: apiKey,
            PublicationID: PublicationID,
            IssueID: IssueID,
            StyleID: StyleID,
            endpoint: endpoint,
            previewImage: previewImage,
            pages: pages
        };

        $.save(settings);
    }

    $.resetFromPublication = function(apiKey, PublicationID, canvasflowApi, endpoint) {
        var IssueID = '';
        var StyleID = '';
        var previewImage = $.savedSettings.previewImage;
        var pages = $.savedSettings.pages;
    
        var publications = $.getPublications(apiKey, canvasflowApi);
        var publication = $.getItemByID(publications, PublicationID, canvasflowApi);
        
        if(publication.type === 'issue') {
            var issues = $.getIssues(apiKey, PublicationID, canvasflowApi);
            var issue = issues[0];
            IssueID = issue.id;
        }
    
        var styles = $.getStyles(apiKey, PublicationID, canvasflowApi);
        var style = styles[0];
        StyleID = style.id;

        var settings = {
            apiKey: apiKey,
            PublicationID: PublicationID,
            IssueID: IssueID,
            StyleID: StyleID,
            endpoint: endpoint,
            previewImage: previewImage,
            pages: pages
        };

        $.save(settings);
    }
    // this.getOkCallback = getOkCallback.bind(this);

    $.save = function(settings) {
        var file = new File($.settingsPath);
        file.encoding = 'UTF-8';
        file.open('w');
        var content = '{"apiKey":"' + settings.apiKey + 
        '", "PublicationID": "' + settings.PublicationID + 
        '", "IssueID":"' + settings.IssueID + 
        '", "StyleID": "' + settings.StyleID + 
        '", "endpoint": "' + settings.endpoint + 
        '", "previewImage": ' + settings.previewImage +
        ', "pages": "' + (settings.pages || '') + 
        '"}';
        file.write(content);
        file.close();
    }

    $.processPublic = function() {
        var savedSettings = $.savedSettings;
        if(!savedSettings) {
            savedSettings = JSON.parse($.defaultSavedSettings);
            $.savedSettings = savedSettings;
        }

        var endpoint = 'api.canvasflow.io';
        var canvasflowApi = new CanvasflowApi('http://' + endpoint + '/v2');

        var apiKeyExist = false;
        
        var settingsDialog = new Window('dialog', 'Settings');
        settingsDialog.orientation = 'column';
        settingsDialog.alignment = 'right';
        settingsDialog.preferredSize = [300,100];

        var valuesWidth = 200;
        var labelWidth = 150;

        var publications = [];
        var selectedPublication;
        var selectedEndpoint;
        var publicationType = '';

        var issues = [];
        var styles = [];

        // Add Preview Image selector
        var previewImageOptions = ['True', 'False'];
        settingsDialog.previewImageDropDownGroup = settingsDialog.add('group');
        settingsDialog.previewImageDropDownGroup.orientation = 'row';
        settingsDialog.previewImageDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Use Thumbnails');
        settingsDialog.previewImageDropDownGroup.dropDown = settingsDialog.previewImageDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:previewImageOptions});
        settingsDialog.previewImageDropDownGroup.dropDown.helpTip = 'The plugin will use ';
        if(savedSettings.previewImage === true ) {
            savedSettings.previewImage = true;
            $.savedSettings.previewImage = true;
            settingsDialog.previewImageDropDownGroup.dropDown.selection = 0;
        } else {
            savedSettings.previewImage = false;
            $.savedSettings.previewImage = false;
            settingsDialog.previewImageDropDownGroup.dropDown.selection = 1;
        }

        //Add Api Key
        settingsDialog.apiKeyGroup = settingsDialog.add('group');
        settingsDialog.apiKeyGroup.orientation = 'row';
        settingsDialog.apiKeyGroup.add('statictext', [0, 0, labelWidth, 20], "API Key");
        settingsDialog.apiKeyGroup.apiKey = settingsDialog.apiKeyGroup.add('edittext', [0, 0, valuesWidth, 20], $.savedSettings.apiKey);

        if(!!savedSettings.apiKey) {
            apiKeyExist = true

            //Add Publication list
            publications = $.getPublications(savedSettings.apiKey, canvasflowApi);
            settingsDialog.publicationDropDownGroup = settingsDialog.add('group');
            settingsDialog.publicationDropDownGroup.orientation = 'row';
            settingsDialog.publicationDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Publication");
            settingsDialog.publicationDropDownGroup.dropDown = settingsDialog.publicationDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(publications)});
            
            if(!!savedSettings.PublicationID) {
                selectedPublication = $.getItemByID(publications, savedSettings.PublicationID);
                settingsDialog.publicationDropDownGroup.dropDown.selection = $.getItemIndexByID(publications, savedSettings.PublicationID);
            } else {
                selectedPublication = publications[0];
                settingsDialog.publicationDropDownGroup.dropDown.selection = 0;
            }

            publicationType = selectedPublication.type;

            // Check if publication is an issue
            if(publicationType === 'issue') {
                issues = $.getIssues(savedSettings.apiKey, selectedPublication.id, canvasflowApi);
                settingsDialog.issueDropDownGroup = settingsDialog.add('group');
                settingsDialog.issueDropDownGroup.orientation = 'row';
                settingsDialog.issueDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Issue");
                settingsDialog.issueDropDownGroup.dropDown = settingsDialog.issueDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(issues)})

                if(!!savedSettings.IssueID) {
                    settingsDialog.issueDropDownGroup.dropDown.selection = $.getItemIndexByID(issues, savedSettings.IssueID)
                } else {
                    settingsDialog.issueDropDownGroup.dropDown.selection = 0;
                }
            }

            // Select styles
            styles = $.getStyles(savedSettings.apiKey, selectedPublication.id, canvasflowApi);
            settingsDialog.styleDropDownGroup = settingsDialog.add('group');
            settingsDialog.styleDropDownGroup.orientation = 'row';
            settingsDialog.styleDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Style");
            settingsDialog.styleDropDownGroup.dropDown = settingsDialog.styleDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(styles)})

            if(!!savedSettings.StyleID) {
                settingsDialog.styleDropDownGroup.dropDown.selection = $.getItemIndexByID(styles, savedSettings.StyleID)
            } else {
                settingsDialog.styleDropDownGroup.dropDown.selection = 0;
            }
        } else {
            apiKeyExist = false;
        }

        // Panel buttons
        settingsDialog.buttonsBarGroup = settingsDialog.add('group');
        settingsDialog.buttonsBarGroup.orientation = 'row';
        settingsDialog.buttonsBarGroup.alignChildren = 'bottom';    
        settingsDialog.buttonsBarGroup.cancelBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'Cancel');
        settingsDialog.buttonsBarGroup.saveBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'OK');
        
        settingsDialog.buttonsBarGroup.saveBtn.onClick = function() {
            if(settingsDialog.previewImageDropDownGroup.dropDown.selection.index === 0) {
                $.savedSettings.previewImage = true;
            } else {
                $.savedSettings.previewImage = false;
            }

            if(!apiKeyExist) {
                var reply = canvasflowApi.validate(settingsDialog.apiKeyGroup.apiKey.text);
                var response = JSON.parse(reply);
                if(response.isValid) {
                    $.resetFromApi(settingsDialog.apiKeyGroup.apiKey.text, canvasflowApi);
                    settingsDialog.destroy();
                } else {
                    alert(reply.replace(/(")/gi, ''));
                }
            } else {
                // The api key was already validated
                if(savedSettings.apiKey !== settingsDialog.apiKeyGroup.apiKey.text) {
                    var reply = canvasflowApi.validate(settingsDialog.apiKeyGroup.apiKey.text);
                    var response = JSON.parse(reply);
                    if(response.isValid) {
                        $.resetFromApi(settingsDialog.apiKeyGroup.apiKey.text, canvasflowApi);
                        settingsDialog.destroy();
                    } else {
                        alert(reply.replace(/(")/gi, ''));
                    }
                } else {
                    var PublicationID = publications[settingsDialog.publicationDropDownGroup.dropDown.selection.index].id;
                    if(savedSettings.PublicationID != PublicationID) {
                        $.resetFromPublication(savedSettings.apiKey, PublicationID, canvasflowApi);
                        settingsDialog.destroy();
                    } else {
                        var StyleID = '';
                        try {
                            StyleID = styles[settingsDialog.styleDropDownGroup.dropDown.selection.index].id;
                        } catch(e) {
                            StyleID = '';
                        }

                        var IssueID = '';
                        try {
                            IssueID = issues[settingsDialog.issueDropDownGroup.dropDown.selection.index].id;
                        } catch(e) {
                            IssueID = '';
                        }
                        
                        savedSettings.PublicationID = PublicationID;
                        savedSettings.StyleID = StyleID;
                        savedSettings.IssueID = IssueID;
                        savedSettings.endpoint = selectedEndpoint.id;

                        $.save(savedSettings);
                        settingsDialog.destroy();
                    }
                }
            } 
        }

        settingsDialog.buttonsBarGroup.cancelBtn.onClick = function() {
            settingsDialog.destroy();
        }
        settingsDialog.show();
    };

    $.processInternal = function() {
        var savedSettings = $.savedSettings;
        if(!savedSettings) {
            savedSettings = JSON.parse($.defaultSavedSettings);
            $.savedSettings = savedSettings;
        }

        var canvasflowApi;

        var apiKeyExist = false;
        var endpointExist = false;
        var settingsDialog = new Window('dialog', 'Settings');
        settingsDialog.orientation = 'column';
        settingsDialog.alignment = 'right';
        settingsDialog.preferredSize = [300,100];

        var valuesWidth = 200;
        var labelWidth = 150;

        var publications = [];
        var selectedPublication;
        var selectedEndpoint;
        var publicationType = '';

        var issues = [];
        var styles = [];

        // Add Preview Image selector
        var previewImageOptions = ['True', 'False'];
        settingsDialog.previewImageDropDownGroup = settingsDialog.add('group');
        settingsDialog.previewImageDropDownGroup.orientation = 'row';
        settingsDialog.previewImageDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Use preview images');
        settingsDialog.previewImageDropDownGroup.dropDown = settingsDialog.previewImageDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:previewImageOptions});
        if(savedSettings.previewImage === true ) {
            savedSettings.previewImage = true;
            $.savedSettings.previewImage = true;
            settingsDialog.previewImageDropDownGroup.dropDown.selection = 0;
        } else {
            savedSettings.previewImage = false;
            $.savedSettings.previewImage = false;
            settingsDialog.previewImageDropDownGroup.dropDown.selection = 1;
        }

        // Add endpoint selector
        var endpoints = [
            {
                name: 'Live',
                id: 'api.canvasflow.io'
            },
            {
                name: 'Cflowdev',
                id: 'api.cflowdev.com'
            }
        ];
        settingsDialog.endpointDropDownGroup = settingsDialog.add('group');
        settingsDialog.endpointDropDownGroup.orientation = 'row';
        settingsDialog.endpointDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Endpoint");
        settingsDialog.endpointDropDownGroup.dropDown = settingsDialog.endpointDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(endpoints)});  

        if(!!savedSettings.endpoint) {
            canvasflowApi = new CanvasflowApi('http://' + savedSettings.endpoint + '/v2');
            endpointExist = true;
            selectedEndpoint = $.getItemByID(endpoints, savedSettings.endpoint);
            settingsDialog.endpointDropDownGroup.dropDown.selection = $.getItemIndexByID(endpoints, savedSettings.endpoint);

            //Add Api Key
            settingsDialog.apiKeyGroup = settingsDialog.add('group');
            settingsDialog.apiKeyGroup.orientation = 'row';
            settingsDialog.apiKeyGroup.add('statictext', [0, 0, labelWidth, 20], "API Key");
            settingsDialog.apiKeyGroup.apiKey = settingsDialog.apiKeyGroup.add('edittext', [0, 0, valuesWidth, 20], $.savedSettings.apiKey);
            
            if(!!savedSettings.apiKey) {
                apiKeyExist = true

                //Add Publication list
                publications = $.getPublications(savedSettings.apiKey, canvasflowApi);
                settingsDialog.publicationDropDownGroup = settingsDialog.add('group');
                settingsDialog.publicationDropDownGroup.orientation = 'row';
                settingsDialog.publicationDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Publication");
                settingsDialog.publicationDropDownGroup.dropDown = settingsDialog.publicationDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(publications)});
                
                if(!!savedSettings.PublicationID) {
                    selectedPublication = $.getItemByID(publications, savedSettings.PublicationID);
                    settingsDialog.publicationDropDownGroup.dropDown.selection = $.getItemIndexByID(publications, savedSettings.PublicationID);
                } else {
                    selectedPublication = publications[0];
                    settingsDialog.publicationDropDownGroup.dropDown.selection = 0;
                }

                publicationType = selectedPublication.type;

                // Check if publication is an issue
                if(publicationType === 'issue') {
                    issues = $.getIssues(savedSettings.apiKey, selectedPublication.id, canvasflowApi);
                    settingsDialog.issueDropDownGroup = settingsDialog.add('group');
                    settingsDialog.issueDropDownGroup.orientation = 'row';
                    settingsDialog.issueDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Issue");
                    settingsDialog.issueDropDownGroup.dropDown = settingsDialog.issueDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(issues)})

                    if(!!savedSettings.IssueID) {
                        settingsDialog.issueDropDownGroup.dropDown.selection = $.getItemIndexByID(issues, savedSettings.IssueID)
                    } else {
                        settingsDialog.issueDropDownGroup.dropDown.selection = 0;
                    }
                }

                // Select styles
                styles = $.getStyles(savedSettings.apiKey, selectedPublication.id, canvasflowApi);
                settingsDialog.styleDropDownGroup = settingsDialog.add('group');
                settingsDialog.styleDropDownGroup.orientation = 'row';
                settingsDialog.styleDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Style");
                settingsDialog.styleDropDownGroup.dropDown = settingsDialog.styleDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:$.mapItemsName(styles)})

                if(!!savedSettings.StyleID) {
                    settingsDialog.styleDropDownGroup.dropDown.selection = $.getItemIndexByID(styles, savedSettings.StyleID)
                } else {
                    settingsDialog.styleDropDownGroup.dropDown.selection = 0;
                }
            } else {
                apiKeyExist = false;
            }
        } else {
            selectedEndpoint = endpoints[0];
            settingsDialog.endpointDropDownGroup.dropDown.selection = 0;
        }

        // Add Range selector
        settingsDialog.pagesGroup = settingsDialog.add('group');
        settingsDialog.pagesGroup.orientation = 'row';
        settingsDialog.pagesGroup.add('statictext', [0, 0, labelWidth, 20], "Pages");
        settingsDialog.pagesGroup.pages = settingsDialog.pagesGroup.add('edittext', [0, 0, valuesWidth, 20], $.savedSettings.pages);

        // Panel buttons
        settingsDialog.buttonsBarGroup = settingsDialog.add('group');
        settingsDialog.buttonsBarGroup.orientation = 'row';
        settingsDialog.buttonsBarGroup.alignChildren = 'bottom';    
        settingsDialog.buttonsBarGroup.cancelBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'Cancel');
        settingsDialog.buttonsBarGroup.saveBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'OK');
        
        settingsDialog.buttonsBarGroup.saveBtn.onClick = function() {
            if(settingsDialog.previewImageDropDownGroup.dropDown.selection.index === 0) {
                $.savedSettings.previewImage = true;
            } else {
                $.savedSettings.previewImage = false;
            }

            var pages = settingsDialog.pagesGroup.pages.text;;
            
            if(!!pages.length) {
                var results = /^([0-9]+)(-)+([0-9]+)$/.exec(pages)
                if(results === null) {
                    alert('The range for pages has an invalid syntax');
                    return;
                }

                var lowerRange = parseInt(results[1]);
                var higherRange = parseInt(results[3]);

                if(!lowerRange) {
                    alert('The lower range should be bigger than 0');
                    return;
                }

                if(!higherRange) {
                    alert('The higher range should be bigger than 0');
                    return;
                }

                if(lowerRange > higherRange) {
                    alert('The lower range should be smaller than the higher range ' + lowerRange + '>' + higherRange);
                    return;
                }
            }

            $.savedSettings.pages = pages;

            if(!endpointExist) {
                $.resetFromEndpoint(endpoints[settingsDialog.endpointDropDownGroup.dropDown.selection.index].id);
                settingsDialog.destroy();
            } else {
                var endpoint = endpoints[settingsDialog.endpointDropDownGroup.dropDown.selection.index].id;
                if(savedSettings.endpoint !== endpoints[settingsDialog.endpointDropDownGroup.dropDown.selection.index].id) {
                    $.resetFromEndpoint(endpoints[settingsDialog.endpointDropDownGroup.dropDown.selection.index].id);
                    settingsDialog.destroy();
                    return;
                }

                canvasflowApi = new CanvasflowApi('http://' + endpoint + '/v1');

                if(!apiKeyExist) {
                    var reply = canvasflowApi.validate(settingsDialog.apiKeyGroup.apiKey.text);
                    var response = JSON.parse(reply);
                    if(response.isValid) {
                        $.resetFromApi(settingsDialog.apiKeyGroup.apiKey.text, canvasflowApi, endpoint);
                        settingsDialog.destroy();
                    } else {
                        alert(reply.replace(/(")/gi, ''));
                    }
                } else {
                    // The api key was already validated
                    if(savedSettings.apiKey !== settingsDialog.apiKeyGroup.apiKey.text) {
                        var reply = canvasflowApi.validate(settingsDialog.apiKeyGroup.apiKey.text);
                        var response = JSON.parse(reply);
                        if(response.isValid) {
                            $.resetFromApi(settingsDialog.apiKeyGroup.apiKey.text, canvasflowApi, endpoint);
                            settingsDialog.destroy();
                        } else {
                            alert(reply.replace(/(")/gi, ''));
                        }
                    } else {
                        var PublicationID = publications[settingsDialog.publicationDropDownGroup.dropDown.selection.index].id;
                        if(savedSettings.PublicationID != PublicationID) {
                            $.resetFromPublication(savedSettings.apiKey, PublicationID, canvasflowApi, endpoint);
                            settingsDialog.destroy();
                        } else {
                            var StyleID = '';
                            try {
                                StyleID = styles[settingsDialog.styleDropDownGroup.dropDown.selection.index].id;
                            } catch(e) {
                                StyleID = '';
                            }
    
                            var IssueID = '';
                            try {
                                IssueID = issues[settingsDialog.issueDropDownGroup.dropDown.selection.index].id;
                            } catch(e) {
                                IssueID = '';
                            }
                            
                            savedSettings.PublicationID = PublicationID;
                            savedSettings.StyleID = StyleID;
                            savedSettings.IssueID = IssueID;
                            savedSettings.endpoint = selectedEndpoint.id;
    
                            $.save(savedSettings);
                            settingsDialog.destroy();
                        }
                    }
                } 
            }
        }

        settingsDialog.buttonsBarGroup.cancelBtn.onClick = function() {
            settingsDialog.destroy();
        }
        settingsDialog.show();
    };

    $.show = function() {
        if(!!$.isInternal) {
            $.processInternal()
        } else {
            $.processPublic();
        }
    };
}

var CanvasflowPublish = function(settingsPath, host, cfBuild) {
    var $ = this;
    $.baseDirectory = '';
    $.filePath = '';
    $.uuid = '';
    $.host = host;
    $.canvasflowApi = null;
    $.dialog = {};
    $.pagesRange = null;
    $.cfBuild = cfBuild;

    $.settingsPath = settingsPath;

    $.getSavedSettings = function() {
        var file = new File($.settingsPath);
        if(file.exists) {
            file.open('r');
            return JSON.parse(file.read());
        }
    };
    $.savedSettings = $.getSavedSettings();

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

            $.uuid = $.cfBuild.uuid || '';
    
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
                alert(reply);
                // var response = JSON.parse(data);
                return true;
            } else {
                alert(reply);
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
                var baseDirectory = app.activeDocument.filePath + '/';
                $.filePath = baseDirectory + app.activeDocument.name;
                var ext = app.activeDocument.name.split('.').pop();
                $.baseDirectory = baseDirectory + app.activeDocument.name.replace("." + ext, '');
                zipFilePath = cfBuild.build();
            } catch(e) {
                alert('Error: ' + e.message);
                return;
            }

            var onPublish = function() {
                try {
                    var publishStartTime = (new Date()).getTime();
                    if($.uploadZip(zipFilePath)) {
                        $.cleanUp();
                        new File(zipFilePath).remove()
                        alert('Article was uploaded successfully');
                        logger.log((new Date()).getTime() - publishStartTime, 'Publishing')
                    } else {
                        logger.log((new Date()).getTime() - publishStartTime, 'Publishing with error')
                        throw new Error('Error uploading the content, please try again');
                    }
                } catch(e) {
                    alert('Error: ' + e.message);
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

var CanvasflowPlugin = function() {
    var $ = this;

    $.install = function() {
        try {
            app.menus.item("$ID/Main").submenus.item("Canvasflow").remove();
        } catch(e) {
    
        }
    
        var canvasflowScriptActionSettings = app.scriptMenuActions.add("Settings");  
        canvasflowScriptActionSettings.eventListeners.add("onInvoke", function() {  
            var canvasflowDialog = new CanvasflowDialog(settingsFilePath, isInternal);
            canvasflowDialog.show();
        }); 
        
        var canvasflowScriptActionPublish = app.scriptMenuActions.add("Publish");  
        canvasflowScriptActionPublish.eventListeners.add("onInvoke", function() {  
            var canvasflowBuild = new CanvasflowBuild(settingsFilePath, commandFilePath);
            var canvasflowPublish = new CanvasflowPublish(settingsFilePath, "api.cflowdev.com", canvasflowBuild);
            canvasflowPublish.publish();
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
}

logger = new CanvasflowLogger(logFilePath, isDebugEnable);
var canvasflowPlugin = new CanvasflowPlugin();
canvasflowPlugin.install();