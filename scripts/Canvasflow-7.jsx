#targetengine "session" 

var version='0.7.0'; 

 if (typeof JSON !== "object") {
	JSON = {};
}
(function() {
	"use strict";
	var rx_one = /^[\],:{}\s]*$/;
	var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
	var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
	var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
	var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
	var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
	function f(n) {
		return (n < 10) ?
			"0" + n :
			n;
	}
	function this_value() {
		return this.valueOf();
	}
	if (typeof Date.prototype.toJSON !== "function") {
		Date.prototype.toJSON = function() {
			return isFinite(this.valueOf()) ?
				(
					this.getUTCFullYear() +
					"-" +
					f(this.getUTCMonth() + 1) +
					"-" +
					f(this.getUTCDate()) +
					"T" +
					f(this.getUTCHours()) +
					":" +
					f(this.getUTCMinutes()) +
					":" +
					f(this.getUTCSeconds()) +
					"Z"
				) :
				null;
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
		return rx_escapable.test(string) ?
			"\"" + string.replace(rx_escapable, function(a) {
				var c = meta[a];
				return typeof c === "string" ?
					c :
					"\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
			}) + "\"" :
			"\"" + string + "\"";
	}
	function str(key, holder) {
		var i;
		var k;
		var v;
		var length;
		var mind = gap;
		var partial;
		var value = holder[key];
		if (
			value &&
			typeof value === "object" &&
			typeof value.toJSON === "function"
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
				return (isFinite(value)) ?
					String(value) :
					"null";
			case "boolean":
			case "null":
				return String(value);
			case "object":
				if (!value) {
					return "null";
				}
				gap += indent;
				partial = [];
				if (Object.prototype.toString.apply(value) === "[object Array]") {
					length = value.length;
					for (i = 0; i < length; i += 1) {
						partial[i] = str(i, value) || "null";
					}
					v = partial.length === 0 ?
						"[]" :
						gap ?
						(
							"[\n" +
							gap +
							partial.join(",\n" + gap) +
							"\n" +
							mind +
							"]"
						) :
						"[" + partial.join(",") + "]";
					gap = mind;
					return v;
				}
				if (rep && typeof rep === "object") {
					length = rep.length;
					for (i = 0; i < length; i += 1) {
						if (typeof rep[i] === "string") {
							k = rep[i];
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (
									(gap) ?
									": " :
									":"
								) + v);
							}
						}
					}
				} else {
					for (k in value) {
						if (Object.prototype.hasOwnProperty.call(value, k)) {
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (
									(gap) ?
									": " :
									":"
								) + v);
							}
						}
					}
				}
				v = partial.length === 0 ?
					"{}" :
					gap ?
					"{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" :
					"{" + partial.join(",") + "}";
				gap = mind;
				return v;
		}
	}
	if (typeof JSON.stringify !== "function") {
		meta = {
			"\b": "\\b",
			"\t": "\\t",
			"\n": "\\n",
			"\f": "\\f",
			"\r": "\\r",
			"\"": "\\\"",
			"\\": "\\\\"
		};
		JSON.stringify = function(value, replacer, space) {
			var i;
			gap = "";
			indent = "";
			if (typeof space === "number") {
				for (i = 0; i < space; i += 1) {
					indent += " ";
				}
			} else if (typeof space === "string") {
				indent = space;
			}
			rep = replacer;
			if (replacer && typeof replacer !== "function" && (
					typeof replacer !== "object" ||
					typeof replacer.length !== "number"
				)) {
				throw new Error("JSON.stringify");
			}
			return str("", {
				"": value
			});
		};
	}
	if (typeof JSON.parse !== "function") {
		JSON.parse = function(text, reviver) {
			var j;
			function walk(holder, key) {
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
			text = String(text);
			rx_dangerous.lastIndex = 0;
			if (rx_dangerous.test(text)) {
				text = text.replace(rx_dangerous, function(a) {
					return (
						"\\u" +
						("0000" + a.charCodeAt(0).toString(16)).slice(-4)
					);
				});
			}
			if (
				rx_one.test(
					text
					.replace(rx_two, "@")
					.replace(rx_three, "]")
					.replace(rx_four, "")
				)
			) {
				j = eval("(" + text + ")");
				return (typeof reviver === "function") ?
					walk({
						"": j
					}, "") :
					j;
			}
			throw new SyntaxError("JSON.parse");
		};
	}
}());
function getBasePath() {
	var path = $.getenv('CF_USER_BASE_PATH');
	if (!!path) {
		return path;
	}
	return '~';
}
function getEnv(env) {
	$.getenv(env)
}
function isDir(file) {
	if (!!file.lineFeed) {
		return false
	}
	return true;
}
function removeDir(dirPath) {
	var dir = new Folder(dirPath);
	var files = dir.getFiles();
	if (!!files.length) {
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			if (isDir(file)) {
				removeDir(file.fsName)
			} else {
				file.remove()
			}
		}
	}
	dir.remove();
}
Error.prototype.toJson = function() {
	if (typeof this.stack === "undefined" || this.stack === null) {
		this.stack = "placeholder";
		this.stack = $.stack;
	}
	return JSON.stringify({
		line: this.line,
		message: this.message,
		stack: this.stack
	})
}
Error.prototype.toLog = function(logPath) {
	if (typeof this.stack === "undefined" || this.stack === null) {
		this.stack = "placeholder";
		this.stack = $.stack;
	}
	var file = new File(logPath);
	file.encoding = 'UTF-8';
	file.open('w');
	file.writeln('line: ' + this.line);
	file.writeln('message: ' + this.message);
	file.writeln('stack: ' + this.stack);
	file.close();
}
function logError(e) {
	var file = new File(getBasePath() + '/cf-indesign/canvasflow_error.json');
	file.encoding = 'UTF-8';
	file.open('w');
	file.write(e.toJson());
	file.close();
	e.toLog(getBasePath() + '/cf-indesign/canvasflow_error.log')
	alert(e.toJson())
}
var apiKeySetting = 1;
var isInternal = true;
var canvasflowSettingsKey = "CanvasflowSettings";
var baseDirName = 'cf-indesign';
var os = 'unix';
if (/^Win(.)*/gm.test($.os)) {
	os = 'dos';
}
var settingsFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_settings.json';
var resizeCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_resize.command';
var convertCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_convert.command';
if (os === 'dos') {
	resizeCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_resize.bat';
	convertCommandFilePath = getBasePath() + '/' + baseDirName + '/canvasflow_convert.bat';
}
var defaultHost = 'api.canvasflow.io';
var logFilePath = getBasePath() + '/' + baseDirName + '/canvasflow.log';
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
		if (file.exists) {
			file.open('r');
			file.remove();
		}
		if ($.enable) {
			var file = new File($.logFilePath);
			file.encoding = 'UTF-8';
			file.open('w');
			file.write('');
			file.close();
		}
	}
	$.log = function(ms, name) {
		if ($.enable) {
			var file = new File($.logFilePath);
			file.encoding = 'UTF-8';
			file.open('a');
			file.write(ms + ' - ' + name + '\n');
			file.close();
		}
	}
	$.createFile();
}
logger = new CanvasflowLogger(logFilePath, isDebugEnable);
var HTTPFile = function(url, port) {
	if (arguments.length == 1) {
		url = arguments[0];
		port = 80;
	};
	this.url = url;
	this.port = port;
	this.httpPrefix = this.url.match(/http:\/\//);
	this.domain = this.httpPrefix == null ? this.url.split("/")[0] + ":" + this.port : this.url.split("/")[2] + ":" + this.port;
	this.call = "GET " + (this.httpPrefix == null ? "http://" + this.url : this.url) + " HTTP/1.0\r\nHost:" + (this.httpPrefix == null ? this.url.split("/")[0] : this.url.split("/")[2]) + "\r\nAccept-encoding: gzip\r\nConnection: close\r\n\r\n";
	this.reply = new String();
	this.conn = new Socket();
	this.conn.encoding = "binary";
	HTTPFile.prototype.getResponse = function(f) {
		var typeMatch = this.url.match(/(\.)(\w{3,4}\b)/g);
		if (this.conn.open(this.domain, "binary")) {
			this.conn.write(this.call);
			this.reply = this.conn.read(9999999999);
			this.conn.close();
		} else {
			this.reply = null;
		}
		if (this.reply === null) return null
		return this.reply.substr(this.reply.indexOf("\r\n\r\n") + 4);
	};
}
var CanvasflowApi = function(host) {
	this.host = host;
	CanvasflowApi.prototype.http = function(method, ignoreParse) {
		var reply = new HTTPFile(this.host + method + "&qid=" + Date.now());
		if (!!ignoreParse) {
			return reply.getResponse();
		}
		return JSON.parse(reply.getResponse());
	}
	CanvasflowApi.prototype.getHealth = function() {
		return this.http('/health?cf=1', true);
	};
	CanvasflowApi.prototype.getPublications = function(apiKey) {
		return this.http('/publications?secretkey=' + apiKey);
	};
	CanvasflowApi.prototype.validate = function(apiKey) {
		return this.http('/info?secretkey=' + apiKey);
	};
	CanvasflowApi.prototype.getIssues = function(apiKey, PublicationID) {
		return this.http('/issues?secretkey=' + apiKey + '&publicationId=' + PublicationID);
	};
	CanvasflowApi.prototype.getStyles = function(apiKey, PublicationID) {
		return this.http('/styles?secretkey=' + apiKey + '&publicationId=' + PublicationID);
	};
}
var CanvasflowAbout = function(version) {
	var $ = this;
	$.version = version;
	$.show = function() {
		var dialog = new Window('dialog', 'Canvasflow');
		dialog.orientation = 'column';
		dialog.alignment = 'right';
		dialog.preferredSize = [300, 100];
		var labelWidth = 100;
		var valueWidth = 200;
		var title = dialog.add('statictext', undefined, 'InDesign to Canvasflow');
		title.alignment = 'left';
		var fields = [{
				label: 'Version',
				value: $.version
			},
			{
				label: 'Install path',
				value: getBasePath()
			},
			{
				label: 'Support',
				value: 'support@canvasflow.io'
			},
			{
				label: 'Website',
				value: 'https://canvasflow.io'
			}
		];
		for (var i = 0; i < fields.length; i++) {
			var field = fields[i];
			var group = dialog.add('group');
			group.orientation = 'row';
			group.add('statictext', [0, 0, labelWidth, 20], field.label);
			group.add('statictext', [0, 0, valueWidth, 20], field.value);
		}
		dialog.add('statictext', [0, 0, labelWidth, 0], '');
		var copyright = dialog.add('statictext', undefined, '\u00A9 2015-2019 Canvasflow Ltd');
		copyright.alignment = 'left';
		dialog.buttonsBarGroup = dialog.add('group', undefined, 'buttons');
		dialog.buttonsBarGroup.closeBtn = dialog.add('button', undefined, 'Close');
		dialog.buttonsBarGroup.closeBtn.alignment = 'bottom';
		dialog.buttonsBarGroup.closeBtn.onClick = function() {
			dialog.close();
		}
		dialog.show();
	}
}
var CanvasflowBuild = function(canvasflowSettings, resizeCommandFilePath, convertCommandFilePath, os) {
	var $ = this;
	$.resizeCommandFilePath = resizeCommandFilePath || '';
	$.convertCommandFilePath = convertCommandFilePath || '';
	$.os = os;
	$.imagesToResize = [];
	$.imagesToConvert = [];
	$.imageSizeCap = 1.5 * 1000000;
	$.baseDirName = 'cf-indesign';
	$.isBuildSuccess = true;
	$.resizingImageLockFilePath = getBasePath() + '/' + $.baseDirName + '/canvasflow_resizing.lock';
	$.convertImageLockFilePath = getBasePath() + '/' + $.baseDirName + '/canvasflow_convert.lock';
	$.savedSettings = canvasflowSettings.getSavedSettings();
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
		if (!!label) {
			return label;
		}
		return '';
	}
	$.getUUID = function() {
		var dt = new Date().getTime();
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (dt + Math.random() * 16) % 16 | 0;
			dt = Math.floor(dt / 16);
			return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
		return uuid.substring(0, uuid.length / 2);
	}
	$.getDocumentID = function(doc) {
		var uuid = $.getUUIDFromDocument(doc);
		if (!uuid) {
			var dt = new Date().getTime();
			var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = (dt + Math.random() * 16) % 16 | 0;
				dt = Math.floor(dt / 16);
				return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
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
			x: xi,
			y: yi
		}
	}
	$.appendTextBoxes = function(textFrames, textBoxes) {
		if (textBoxes.length > 0) {
			for (var i = 0; i < textBoxes.length; i++) {
				var textBox = textBoxes[i];
				for (var j = 0; j < textBox.textFrames.length; j++) {
					textFrames.push(textBox.textFrames[j]);
				}
			}
		}
	}
	$.appendGroups = function(textFrames, groups) {
		if (groups.length > 0) {
			for (var i = 0; i < groups.length; i++) {
				var group = groups[i];
				for (var j = 0; j < group.textFrames.length; j++) {
					textFrames.push(group.textFrames[j]);
				}
			}
		}
	}
	$.getFontFromParagraphs = function(textFrame) {
		var paragraphs = textFrame.paragraphs;
		if (!!paragraphs.count()) {
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
	$.getRealCharacter = function(content) {
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
			content = '\u0027';
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
		return content
	}
	$.getSubstrings = function(characters, textFrameID) {
		var data = [];
		var substring = null;
		var fontStyle = 'Regular';
		for (var i = 0; i < characters.length; i++) {
			var character = characters.item(i);
			var parentTextFrameID = null;
			for (var j = 0; j < character.parentTextFrames.length; j++) {
				var textFrame = character.parentTextFrames[j];
				parentTextFrameID = textFrame.id;
			}
			if (parentTextFrameID !== null) {
				if (parentTextFrameID !== textFrameID) {
					continue;
				}
			}
			if (substring == null) {
				try {
					fontStyle = character.appliedFont.fontStyleName || 'Regular';
				} catch (e) {}
				substring = {
					content: character.contents,
					font: {
						fontFamily: character.appliedFont.fontFamily,
						fontSize: character.pointSize,
						fontStyle: fontStyle
					}
				}
				continue;
			}
			var previousFontStyle = substring.font.fontStyle;
			var currentFontStyle = 'Regular';
			try {
				currentFontStyle = character.appliedFont.fontStyleName || 'Regular';
			} catch (e) {}
			if (previousFontStyle !== currentFontStyle) {
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
			var content = $.getRealCharacter(character.contents);
			substring.content = substring.content + content;
		}
		if (substring !== null) {
			data.push(substring);
		}
		return data;
	}
	$.getParagraphs = function(paragraphs, textFrameID) {
		var response = [];
		for (var i = 0; i < paragraphs.count(); i++) {
			var paragraph = paragraphs.item(i);
			if (paragraph.contents === '\r') {
				continue
			}
			var characterFontFamily = paragraph.appliedCharacterStyle.appliedFont;
			var characterFontSize = paragraph.appliedCharacterStyle.pointSize;
			var characterStyle = {
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
		for (var i = 0; i < page.textFrames.length; i++) {
			textFrames.push(page.textFrames[i]);
		}
		if (page.textBoxes.length > 0) {
			$.appendTextBoxes(textFrames, page.textBoxes)
		}
		if (page.groups.length > 0) {
			$.appendGroups(textFrames, page.groups)
		}
		for (var i = 0; i < textFrames.length; i++) {
			var textFrame = textFrames[i];
			var position = $.getItemPosition(textFrame.geometricBounds);
			if (!!textFrame.contents && !!textFrame.visible && !!textFrame.itemLayer.visible) {
				var next;
				var previous;
				var StoryID;
				try {
					next = textFrame.nextTextFrame.id;
				} catch (e) {}
				try {
					previous = textFrame.previousTextFrame.id;
				} catch (e) {}
				try {
					StoryID = textFrame.parentStory.id;
				} catch (e) {}
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
		try {
			image.exportFile(ExportFormat.JPG, new File(destFilePath));
		} catch (e) {
			alert('I failed trying to export this image: ' + destFilePath);
		}
		return '' + id + '.jpg';
	}
	$.isNotSupportedExtension = function(ext) {
		switch (ext) {
			case 'jpg':
			case 'jpeg':
			case 'eps':
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
				return false;
			default:
				return true;
		}
	}
	$.saveGraphicToImage = function(graphic, imageDirectory) {
		var id = graphic.id;
		var linkPath = graphic.itemLink.filePath;
		var originalImageFile = File(linkPath);
		var ext;
		var destFilePath;
		var fileName = originalImageFile.fsName;
		ext = fileName.split('.').pop().toLowerCase();
		if (ext === 'jpg' || ext === 'jpeg') {
			ext = 'jpg';
		}
		destFilePath = imageDirectory + '/' + id + '.' + ext;
		destFilePath = destFilePath.replace(/%20/gi, ' ');
		if ($.isNotSupportedExtension(ext)) {
			if (!!logger) {
				logger.log((new Date()).getTime(), 'The image extension is not valid: "' + fileName + '", extension: ' + ext);
			}
			return $.exportImageRepresentation(graphic, imageDirectory, id);
		}
		if (!originalImageFile.exists) {
			if (!!logger) {
				logger.log((new Date()).getTime(), 'Image does not exist: "' + fileName + '"');
			}
			return $.exportImageRepresentation(graphic, imageDirectory, id);
		}
		logger.log((new Date()).getTime(), 'Image exists "' + fileName + '" and should be processed by the script');
		var originalImageSize = originalImageFile.length;
		var targetExt;
		switch (ext) {
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
		if (originalImageSize >= $.imageSizeCap) {
			var dataFile = new File(resizeCommandFilePath);
			if (!dataFile.exists) {
				throw new Error('The command "resize" required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@canvasflow.io if you require assistance.');
			}
			$.imagesToResize.push(File(imageDirectory + '/' + id + '.' + ext).fsName);
			return '' + id + '.' + targetExt;
		}
		if (targetExt !== ext) {
			var dataFile = new File(convertCommandFilePath);
			if (!dataFile.exists) {
				throw new Error('The command required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@canvasflow.io if you require assistance.');
			}
			$.imagesToConvert.push(File(imageDirectory + '/' + id + '.' + ext).fsName);
		}
		return '' + id + '.' + targetExt;
	}
	$.getImageFromGraphics = function(graphics, data, baseDirectory) {
		var imageDirectory = baseDirectory + '/images';
		if (graphics.length > 0) {
			for (var i = 0; i < graphics.length; i++) {
				var graphic = graphics[i];
				if (graphic.isValid) {
					var imagePath;
					var position = $.getItemPosition(graphic.parent.geometricBounds);
					var imageExist = $.checkIfGraphicImageExist(graphic);
					if (imageExist) {
						if (graphic.visible) {
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
						if (graphic.visible) {
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
	$.writeToFileScript = function(dataFile, lines) {
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			dataFile.writeln(line);
		}
	}
	$.getResizeImagesScriptContent = function(files) {
		var lines = [];
		if ($.os === 'dos') {
			var basePath = 'userprofile';
			if (!!getEnv('CF_USER_BASE_PATH')) {
				basePath = 'cf_user_base_path';
			}
			lines.push(
				'@echo off',
				'setlocal enabledelayedexpansion'
			)
			for (var i = 0; i < files.length; i++) {
				lines.push('set Files[' + i + ']="' + files[i] + '"')
			}
			lines.push(
				'for /l %%n in (0,1,' + (files.length - 1) + ') do (',
				'\tset original_image=!Files[%%n]!',
				'\tset ext=""',
				'\tset parent_dir=""',
				'\tset filename=""',
				'\tfor %%i in (!original_image!) do set ext=%%~xi',
				'\tfor %%a in (!original_image!) do set parent_dir=%%~dpa',
				'\tfor %%f in (!original_image!) do set filename=%%~nf',
				'\tset image_width_command="magick identify -ping -format \'%%w\' !original_image!"',
				'\tset image_width=""',
				'\tfor /f "delims=" %%a in (\'!image_width_command!\') do set image_width=%%a',
				'\tset image_width=!image_width:\'=!',
				'\tset target_filename="!parent_dir!!filename!.jpg"',
				'\tif !image_width! gtr 2048 (',
				'\t\tif "!ext!" neq ".tif" (',
				'\t\t\tmagick convert -colorspace sRGB -density 2048 -geometry 2048x !original_image! !target_filename!',
				'\t\t) else (',
				'\t\t\tmagick convert -colorspace sRGB -density 2048 -geometry 2048x !original_image![0] -quality 50 !target_filename!',
				'\t\t)',
				'\t) else (',
				'\t\tif "!ext!" neq ".tif" (',
				'\t\t\tmagick convert -colorspace sRGB -density !image_width! !original_image! !target_filename!',
				'\t\t) else (',
				'\t\t\tmagick convert -colorspace sRGB -density !image_width! !original_image![0] -quality 50 !target_filename!',
				'\t\t)',
				'\t)',
				'\tif "!ext!" neq ".jpg" (',
				'\t\tdel "!parent_dir!!filename!!ext!"',
				'\t)',
				')',
				'del %' + basePath + '%\\' + $.baseDirName + '\\canvasflow_resizing.lock'
			)
		} else {
			lines = [
				"CYAN='\033[1;36m'",
				"NC='\033[0m'",
				"GREEN='\033[1;32m'",
				"YELLOW='\033[0;33m'",
				"RED='\033[0;31m'",
				'clear',
				'files=( ' + files.join(' ') + ' )',
				'total_of_images=${#files[@]}',
				'processed_images=0',
				'for file in "${files[@]}"',
				'\tdo :',
				'\t\text="${file#*.}"',
				'\t\tprocessed_images=$((processed_images+1))',
				'\t\tpercentage=$(($((processed_images * 100))/total_of_images))',
				'\t\tif ((percentage < 100)); then',
				'\t\t\tpercentage="${YELLOW}${percentage}%${NC}"',
				'\t\telse',
				'\t\t\tpercentage="${GREEN}${percentage}%${NC}"',
				'\t\tfi',
				'\t\tif [[ $ext == "eps" ]]; then',
				'\t\t\ttransform_to_pdf="pstopdf \\\"${file}\\\""',
				'\t\t\teval $transform_to_pdf',
				'\t\t\tremove_command="rm \\\"${file}\\\""',
				'\t\t\teval $remove_command',
				'\t\t\tfile="$(echo ${file} | sed "s/.${ext}/.pdf/")"',
				'\t\t\text="pdf"',
				'\t\tfi',
				'\t\tclear',
				'\t\techo "Optimizing images ${CYAN}${processed_images}/${total_of_images}${NC} [${percentage}]"',
				'\t\tfilename=$(basename -- \"$file\")',
				'\t\tfilename="${filename%.*}"',
				'\t\timage_width="$({ sips -g pixelWidth \"$file\" || echo 0; } | tail -1 | sed \'s/[^0-9]*//g\')"',
				'\t\tif [ "$image_width" -gt "2048" ]; then',
				'\t\t\tparent_filename="$(dirname "${file})")"',
				'\t\t\ttarget_filename="${parent_filename}/${filename}.jpg"',
				'\t\t\tresize_command="sips -s formatOptions 50 --matchTo \'/System/Library/ColorSync/Profiles/sRGB Profile.icc\' --resampleWidth 2048 -s format jpeg \\\"${file}\\\" --out \\\"${target_filename}\\\"" ',
				'\t\t\teval $resize_command > /dev/null 2>&1',
				'\t\telse',
				'\t\t\tparent_filename="$(dirname "${file})")"',
				'\t\t\ttarget_filename="${parent_filename}/${filename}.jpg"',
				'\t\t\tresize_command="sips -s formatOptions 50 --matchTo \'/System/Library/ColorSync/Profiles/sRGB Profile.icc\' -s format jpeg \\\"${file}\\\" --out \\\"${target_filename}\\\"" ',
				'\t\t\teval $resize_command > /dev/null 2>&1',
				'\t\tfi',
				'\t\tif [[ $ext != "jpeg" ]] && [[ $ext != "jpg" ]]; then',
				'\t\t\tremove_command="rm \\\"${file}\\\""',
				'\t\t\teval $remove_command',
				'\t\tfi',
				'done',
				'rm -f ' + $.resizingImageLockFilePath
			];
		}
		return lines;
	}
	$.resizeImages = function(imageFiles) {
		var dataFile = new File($.resizeCommandFilePath);
		if (!dataFile.exists) {
			throw new Error('The command "resize" required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@canvasflow.io if you require assistance.');
		}
		var files = [];
		for (var i = 0; i < imageFiles.length; i++) {
			if ($.os === 'dos') {
				files.push(imageFiles[i]);
			} else {
				files.push('"' + imageFiles[i] + '"');
			}
		}
		dataFile.encoding = 'UTF-8';
		dataFile.open('w');
		dataFile.lineFeed = 'Unix';
		$.writeToFileScript(dataFile, $.getResizeImagesScriptContent(files));
		dataFile.execute();
		dataFile.close();
	}
	$.getConvertImagesScriptContent = function(files) {
		var lines = [];
		if ($.os === 'dos') {
			var basePath = 'userprofile';
			if (!!getEnv('CF_USER_BASE_PATH')) {
				basePath = 'cf_user_base_path';
			}
			lines.push(
				'@echo off',
				'setlocal enabledelayedexpansion'
			)
			for (var i = 0; i < files.length; i++) {
				lines.push('set Files[' + i + ']="' + files[i] + '"')
			}
			lines.push(
				'for /l %%n in (0,1,' + (files.length - 1) + ') do (',
				'\tset original_image=!Files[%%n]!',
				'\tset ext=""',
				'\tset parent_dir=""',
				'\tset filename=""',
				'\tfor %%i in (!original_image!) do set ext=%%~xi',
				'\tfor %%a in (!original_image!) do set parent_dir=%%~dpa',
				'\tfor %%f in (!original_image!) do set filename=%%~nf',
				'\tset image_width_command="magick identify -ping -format \'%%w\' !original_image!"',
				'\tset image_width=""',
				'\tfor /f "delims=" %%a in (\'!image_width_command!\') do set image_width=%%a',
				'\tset image_width=!image_width:\'=!',
				'\tset target_filename="!parent_dir!!filename!.jpg"',
				'\tif "!ext!" neq ".tif" (',
				'\t\tmagick convert -colorspace sRGB -density !image_width! !original_image! !target_filename!',
				'\t) else (',
				'\t\tmagick convert -colorspace sRGB -density !image_width! !original_image![0] !target_filename!',
				'\t)',
				'\tif "!ext!" neq ".jpg" (',
				'\t\tdel "!parent_dir!!filename!!ext!"',
				'\t)',
				')',
				'del %' + basePath + '%\\' + $.baseDirName + '\\canvasflow_convert.lock'
			)
		} else {
			lines = [
				"CYAN='\033[1;36m'",
				"NC='\033[0m'",
				"GREEN='\033[1;32m'",
				"YELLOW='\033[0;33m'",
				"RED='\033[0;31m'",
				'clear',
				'files=( ' + files.join(' ') + ' )',
				'total_of_images=${#files[@]}',
				'processed_images=0',
				'for file in "${files[@]}"',
				'\tdo :',
				'\t\tprocessed_images=$((processed_images+1))',
				'\t\tpercentage=$(($((processed_images * 100))/total_of_images))',
				'\t\tif ((percentage < 100)); then',
				'\t\t\tpercentage="${YELLOW}${percentage}%${NC}"',
				'\t\telse',
				'\t\t\tpercentage="${GREEN}${percentage}%${NC}"',
				'\t\tfi',
				'\t\text="${file#*.}"',
				'\t\tif [[ $ext == "eps" ]]; then',
				'\t\t\ttransform_to_pdf="echo \'\\\"${file}\\\"\'  | xargs -n1 pstopdf"',
				'\t\t\teval $transform_to_pdf',
				'\t\t\tremove_command="rm \\\"${file}\\\""',
				'\t\t\teval $remove_command',
				'\t\t\tfile="$(echo ${file} | sed "s/.${ext}/.pdf/")"',
				'\t\t\text="pdf"',
				'\t\tfi',
				'\t\techo "Converting images ${CYAN}${processed_images}/${total_of_images}${NC} [${percentage}]"',
				'\t\tfilename=$(basename -- \"$file\")',
				'\t\tfilename="${filename%.*}"',
				'\t\tparent_filename="$(dirname "${file})")"',
				'\t\ttarget_filename="${parent_filename}/${filename}.jpg"',
				'\t\tconvert_command="sips -s format jpeg \\\"${file}\\\" --matchTo \'/System/Library/ColorSync/Profiles/sRGB Profile.icc\' --out \\\"${target_filename}\\\""',
				'\t\teval $convert_command > /dev/null 2>&1',
				'\t\tclear',
				'\t\tremove_command="rm \\\"${file}\\\""',
				'\t\teval $remove_command',
				'done',
				'rm -f ' + $.convertImageLockFilePath
			]
		}
		return lines;
	}
	$.convertImages = function(imageFiles) {
		var dataFile = new File($.convertCommandFilePath);
		if (!dataFile.exists) {
			throw new Error('The command "convert" required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@canvasflow.io if you require assistance.');
		}
		var files = [];
		for (var i = 0; i < imageFiles.length; i++) {
			if ($.os === 'dos') {
				files.push(imageFiles[i]);
			} else {
				files.push('"' + imageFiles[i] + '"');
			}
		}
		dataFile.encoding = 'UTF-8';
		dataFile.open('w');
		dataFile.lineFeed = 'Unix';
		$.writeToFileScript(dataFile, $.getConvertImagesScriptContent(files));
		dataFile.execute();
		dataFile.close();
	}
	$.areAllImagesProcessed = function(baseDirectory) {
		var dataPath = baseDirectory + '/data.json';
		var dataFile = new File(dataPath);
		dataFile.open('r');
		var data = JSON.parse(dataFile.read());
		for (var i = 0; i < data.pages.length; i++) {
			var page = data.pages[i];
			for (var j = 0; j < page.items.length; j++) {
				var item = page.items[j];
				if (item.type === 'Image') {
					var imagePath = baseDirectory + '/images/' + item.content;
					var imageFile = new File(imagePath);
					if (!imageFile.exists) {
						return false;
					}
				}
			}
		}
		return true;
	}
	$.removeMissingImageFromData = function(baseDirectory) {
		var dataPath = baseDirectory + '/data.json';
		var dataFile = new File(dataPath);
		dataFile.open('r');
		var data = JSON.parse(dataFile.read());
		var response = {
			pages: []
		};
		for (var i = 0; i < data.pages.length; i++) {
			var page = data.pages[i];
			var targetPage = {
				id: page.id,
				x: page.x,
				y: page.y,
				width: page.width,
				height: page.height,
				items: []
			};
			for (var j = 0; j < page.items.length; j++) {
				var item = page.items[j];
				if (item.type === 'Image') {
					var imagePath = baseDirectory + '/images/' + item.content;
					var imageFile = new File(imagePath);
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
		dataFile.write(JSON.stringify(response));
		dataFile.close();
		alert('y')
	}
	$.createPackage = function(baseFile) {
		try {
			var resizingLockFile = new File($.resizingImageLockFilePath)
			var convertLockFile = new File($.convertImageLockFilePath)
			if (!resizingLockFile.exists && !convertLockFile.exists) {
				if (!$.areAllImagesProcessed(baseFile.fsName)) {
					var response = confirm('Warning \nOne or more images are missing, do you still want to build?')
					if (response) {
						$.removeMissingImageFromData(baseFile.fsName);
						app.packageUCF(baseFile.fsName, baseFile.fsName + '.zip', 'application/zip');
					} else {
						$.isBuildSuccess = false;
					}
					removeDir(baseFile.fsName);
					return;
				}
				app.packageUCF(baseFile.fsName, baseFile.fsName + '.zip', 'application/zip');
				removeDir(baseFile.fsName);
				return;
			}
			setTimeout(function() {
				$.createPackage(baseFile);
			}, 1000);
		} catch (e) {
			setTimeout(function() {
				$.createPackage(baseFile);
			}, 1000);
		}
	}
	$.cleanLocks = function() {
		var lockFile = new File($.resizingImageLockFilePath)
		if (lockFile.exists) {
			lockFile.remove();
		}
		lockFile = new File($.convertImageLockFilePath)
		if (lockFile.exists) {
			lockFile.remove();
		}
	}
	$.buildZipFile = function(document, data, baseDirectory) {
		var output = baseDirectory + '/data.json';
		var dataFile = new File(output);
		if (dataFile.exists) {
			dataFile.remove();
		}
		dataFile.encoding = 'UTF-8';
		dataFile.open('w');
		dataFile.write(JSON.stringify(data));
		dataFile.close();
		var baseFile = new File(baseDirectory);
		$.cleanLocks();
		if (!!$.imagesToResize.length) {
			var lockFile = new File($.resizingImageLockFilePath)
			lockFile.encoding = 'UTF-8';
			lockFile.open('w');
			lockFile.close();
			$.resizeImages($.imagesToResize);
		}
		if (!!$.imagesToConvert.length) {
			var lockFile = new File($.convertImageLockFilePath)
			lockFile.encoding = 'UTF-8';
			lockFile.open('w');
			lockFile.close();
			$.convertImages($.imagesToConvert);
		}
		$.createPackage(baseFile);
		return baseFile.fsName + '.zip';
	}
	$.getDefaultPages = function() {
		var pages = [];
		for (var i = 0; i < document.pages.length; i++) {
			pages.push(i + 1);
		}
		return pages;
	}
	$.getRangePages = function(input) {
		var pages = [];
		results = /^([0-9]+)(-)+([0-9]+)$/.exec(input);
		var lowerRange = parseInt(results[1]);
		var higherRange = parseInt(results[3]);
		var totalOfPages = document.pages.length;
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
			throw new Error('The lower range "' + lowerRange + '" should be smaller than the total of pages "' + totalOfPages + '"');
		}
		initialPageIndex = lowerRange;
		lastPageIndex = higherRange;
		if (higherRange > totalOfPages) {
			lastPageIndex = totalOfPages
		}
		for (var i = initialPageIndex; i <= lastPageIndex; i++) {
			pages.push(i);
		}
		return pages;
	}
	$.isElementExist = function(arr, element) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] === element) return true;
		}
		return false;
	}
	$.getUniqueArray = function(arr) {
		var response = [];
		for (var i = 0; i < arr.length; i++) {
			var element = arr[i];
			if (!$.isElementExist(response, element)) {
				response.push(element);
			}
		}
		return response;
	}
	$.getCSVPages = function(input) {
		var pages = [];
		var pagesString = input.split(',');
		for (var i = 0; i < pagesString.length; i++) {
			var pageNumber = parseInt(pagesString[i]);
			if (!!pageNumber) {
				pages.push(pageNumber);
			}
		}
		pages = $.getUniqueArray(pages);
		return pages;
	}
	$.build = function() {
		$.isBuildSuccess = true;
		var baseDirectory = app.activeDocument.filePath + '/';
		$.filePath = baseDirectory + app.activeDocument.name;
		var ext = app.activeDocument.name.split('.').pop();
		$.baseDirectory = baseDirectory + app.activeDocument.name.replace("." + ext, '');
		$.createExportFolder();
		var canvasflowBaseDir = new Folder(getBasePath() + '/' + $.baseDirName);
		if (!canvasflowBaseDir.exists) {
			canvasflowBaseDir.create();
		}
		baseDirectory = $.baseDirectory;
		var filePath = $.filePath;
		var templateFile = new File(filePath);
		templateFile.open('r');
		var document = app.activeDocument;
		var zeroPoint = document.zeroPoint;
		document.zeroPoint = [0, 0];
		$.uuid = $.getDocumentID(document);
		var response = {
			pages: []
		};
		var settingPages = $.savedSettings.pages;
		var pages = $.getDefaultPages();
		if (!!settingPages) {
			if (!!/^([0-9]+)(-)+([0-9]+)$/.exec(settingPages)) {
				pages = $.getRangePages(settingPages);
			} else if (!!/^(\d)+(,\d+)*$/.exec(settingPages)) {
				pages = $.getCSVPages(settingPages);
			} else {
				throw new Error('The range for pages has an invalid syntax');
			}
		}
		app.activeDocument.viewPreferences.horizontalMeasurementUnits = 2054187384;
		app.activeDocument.viewPreferences.verticalMeasurementUnits = 2054187384;
		var w = new Window('palette', 'Processing pages');
		w.progressBar = w.add('progressbar', undefined, 0, pages.length);
		w.progressText = w.add('statictext', [0, 0, 100, 20], 'Page 0 of ' + pages.length);
		w.progressBar.preferredSize.width = 300;
		w.show();
		var totalOfPages = pages.length;
		do {
			var pageIndex = pages.shift() - 1;
			var page = document.pages[pageIndex];
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
			w.progressBar.value = w.progressBar.value + 1;
			w.progressText.text = 'Page ' + w.progressBar.value + ' of ' + totalOfPages;
		} while (pages.length !== 0)
		document.zeroPoint = zeroPoint;
		return $.buildZipFile(document, response, baseDirectory);
	}
}
var CanvasflowSettings = function(settingsPath) {
	var $ = this;
	$.settingsPath = settingsPath;
	$.defaultSavedSettings = '{"apiKey":"", "PublicationID": "", "IssueID": "", "StyleID": "", "endpoint": "", "pages": "", "creationMode": "document", "contentOrder": "natural"}';
	$.getSavedSettings = function() {
		var file = new File($.settingsPath);
		if (file.exists) {
			file.open('r');
			return JSON.parse(file.read());
		}
		var file = new File($.settingsPath);
		file.encoding = 'UTF-8';
		file.open('w');
		file.write($.defaultSavedSettings);
		file.close();
		return JSON.parse($.defaultSavedSettings);;
	};
	$.save = function(settings) {
		var file = new File($.settingsPath);
		file.encoding = 'UTF-8';
		file.open('w');
		var content = '{"apiKey":"' + settings.apiKey + '"' +
			', "PublicationID": "' + settings.PublicationID + '"' +
			', "IssueID":"' + settings.IssueID + '"' +
			', "StyleID": "' + settings.StyleID + '"' +
			', "endpoint": "' + settings.endpoint + '"' +
			', "pages": "' + (settings.pages || '') + '"' +
			', "creationMode": "' + (settings.creationMode || 'document') + '"' +
			', "contentOrder": "' + (settings.contentOrder || 'natural') + '"' +
			'}';
		file.write(content);
		file.close();
	}
}
var CanvasflowDialog = function(canvasflowSettingsPath, internal) {
	var $ = this;
	$.canvasflowSettings = new CanvasflowSettings(canvasflowSettingsPath);
	$.settingsDialog = new Window('dialog', 'Canvasflow Settings');
	$.isInternal = internal;
	$.defaultDialogSize = [300, 100];
	$.canvasflowApi;
	$.isValidApiKey = false;
	$.settings = $.canvasflowSettings.getSavedSettings();
	$.publications = [];
	$.publicationType;
	$.endpoints = [{
			name: 'Production',
			id: 'api.canvasflow.io'
		},
		{
			name: 'Development',
			id: 'api.cflowdev.com'
		}
	];
	$.creationModeOptions = ['Document', 'Page'];
	$.validateApiKey = function(canvasflowApi, apiKey) {
		var response = canvasflowApi.validate(apiKey);
		if (response.isValid) {
			return true;
		} else {
			return false;
		}
	}
	$.getPublications = function(apiKey) {
		return $.canvasflowApi.getPublications(apiKey);
	};
	$.getIssues = function(apiKey, PublicationID) {
		return $.canvasflowApi.getIssues(apiKey, PublicationID);
	};
	$.getStyles = function(apiKey, PublicationID) {
		return $.canvasflowApi.getStyles(apiKey, PublicationID);
	};
	$.getItemIndexByID = function(items, id) {
		for (var i = 0; i < items.length; i++) {
			if (items[i].id == id) {
				return i;
			}
		}
		return null;
	}
	$.getItemByID = function(items, id) {
		for (var i = 0; i < items.length; i++) {
			if (items[i].id == id) {
				return items[i];
			}
		}
		return null;
	}
	$.mapItemsName = function(items) {
		var response = [];
		for (var i = 0; i < items.length; i++) {
			response.push(items[i].name);
		}
		return response;
	}
	$.isValidPagesRangeSyntax = function(input) {
		results = /^([0-9]+)(-)+([0-9]+)$/.exec(input);
		var lowerRange = parseInt(results[1]);
		var higherRange = parseInt(results[3]);
		var totalOfPages = document.pages.length;
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
			alert('The lower range "' + lowerRange + '" should be smaller than the total of pages "' + totalOfPages + '"');
			return false;
		}
		return true;
	}
	$.isValidPagesSyntax = function(input) {
		if (!!/^([0-9]+)(-)+([0-9]+)$/.exec(input)) {
			return $.isValidPagesRangeSyntax(input);
		} else if (!!/^(\d)+(,\d+)*$/.exec(input)) {
			return true;
		}
		alert('The range for pages has an invalid syntax');
		return false;
	}
	$.hidePublication = function(settingsDialog) {
		$.settings.PublicationID = '';
		$.settings.IssueID = '';
		$.settings.StyleID = '';
		settingsDialog.publicationDropDownGroup.visible = false;
		settingsDialog.issueDropDownGroup.visible = false;
		settingsDialog.creationModeDropDownGroup.visible = false;
		settingsDialog.contentOrderDropDownGroup.visible = false;
		settingsDialog.styleDropDownGroup.visible = false;
		settingsDialog.pagesGroup.visible = false;
	}
	$.onPublicationChange = function(settingsDialog, selectedPublication) {
		var PublicationID = selectedPublication.id;
		$.settings.IssueID = '';
		$.settings.StyleID = '';
		if (selectedPublication.type === 'issue') {
			$.publicationType = 'issue';
			$.displayIssues(settingsDialog, PublicationID);
		} else {
			$.publicationType = 'article';
			settingsDialog.issueDropDownGroup.visible = false;
		}
		$.displayStyles(settingsDialog, PublicationID)
	}
	$.onEndpointChange = function(settingsDialog) {
		try {
			$.settings.apiKey = '';
			$.hidePublication(settingsDialog);
			settingsDialog.apiKeyGroup.apiKey.text = '';
			var endpointIndex = settingsDialog.endpointDropDownGroup.dropDown.selection.index;
			$.settings.endpoint = $.endpoints[endpointIndex].id;
			$.canvasflowApi = new CanvasflowApi('http://' + $.settings.endpoint + '/v2');
			settingsDialog.buttonsBarGroup.saveBtn.visible = false;
		} catch (e) {
			logError(e);
		}
	}
	$.onApiChange = function() {
		if (!!$.settingsDialog.apiKeyGroup.apiKey.text) {
			$.settingsDialog.buttonsBarGroup.saveBtn.enabled = true;
		} else {
			$.settingsDialog.buttonsBarGroup.saveBtn.enabled = false;
		}
	}
	$.displayIssues = function(settingsDialog, PublicationID) {
		var issues = [];
		$.issues = $.getIssues($.settings.apiKey, PublicationID);
		for (var i = 0; i < $.issues.length; i++) {
			var issue = $.issues[i];
			if (!!issue.id) {
				issues.push(issue);
			}
		}
		$.issues = issues;
		if ($.issues.length === 0) {
			alert('This Publication has no Issues. Please create an Issue and try again.');
			$.settings.IssueID = '';
			return;
		}
		var selection = 0;
		var selectedIssue = $.issues[0];
		if (!!$.settings.IssueID) {
			selectedIssue = $.getItemByID($.issues, $.settings.IssueID);
			if (selectedIssue === null) {
				alert('The currently selected Issue does not exist. \nThe first Issue in the current Publication has been selected. Please click Save to update the change.');
				$.settings.IssueID = '';
				$.displayIssues(settingsDialog, PublicationID);
				return;
			} else {
				selection = $.getItemIndexByID($.issues, selectedIssue.id);
			}
		}
		$.settings.IssueID = selectedIssue.id;
		var issuesNames = $.mapItemsName($.issues);
		settingsDialog.issueDropDownGroup.dropDown.removeAll()
		for (var i = 0; i < issuesNames.length; i++) {
			settingsDialog.issueDropDownGroup.dropDown.add('item', issuesNames[i]);
		}
		settingsDialog.issueDropDownGroup.dropDown.selection = selection;
		settingsDialog.issueDropDownGroup.visible = true;
	}
	$.displayStyles = function(settingsDialog, PublicationID) {
		$.styles = $.getStyles($.settings.apiKey, PublicationID);
		if ($.styles.length === 0) {
			alert('This Publication has no Styles. Please create an Style and try again.');
			return;
		}
		var selectedStyle = $.styles[0];
		var selection = 0;
		if (!!$.settings.StyleID) {
			selectedStyle = $.getItemByID($.styles, $.settings.StyleID);
			if (selectedStyle === null) {
				alert('The currently selected Style does not exist. \nThe first Style in the current Publication has been selected. Please click Save to update the change.');
				selection = 0;
				selectedStyle = $.styles[0];
			} else {
				selection = $.getItemIndexByID($.styles, selectedStyle.id);
			}
		}
		$.settings.StyleID = '' + selectedStyle.id;
		var stylesNames = $.mapItemsName($.styles);
		settingsDialog.styleDropDownGroup.dropDown.removeAll();
		for (var i = 0; i < stylesNames.length; i++) {
			settingsDialog.styleDropDownGroup.dropDown.add('item', stylesNames[i]);
		}
		settingsDialog.styleDropDownGroup.dropDown.selection = selection;
		settingsDialog.styleDropDownGroup.visible = true;
	}
	$.displayPublications = function(settingsDialog) {
		$.publications = $.getPublications($.settings.apiKey);
		if ($.publications.length === 0) {
			throw new Error('No publications were found');
		}
		var selectedPublication = $.publications[0];
		if (!!$.settings.PublicationID) {
			selectedPublication = $.getItemByID($.publications, $.settings.PublicationID);
		}
		$.settings.PublicationID = selectedPublication.id;
		var publicationsNames = $.mapItemsName($.publications);
		settingsDialog.publicationDropDownGroup.dropDown.removeAll()
		for (var i = 0; i < publicationsNames.length; i++) {
			settingsDialog.publicationDropDownGroup.dropDown.add('item', publicationsNames[i]);
		}
		settingsDialog.publicationDropDownGroup.dropDown.selection = $.getItemIndexByID($.publications, selectedPublication.id);
		settingsDialog.publicationDropDownGroup.visible = true;
		$.publicationType = 'article';
		if (selectedPublication.type === 'issue') {
			$.publicationType = 'issue';
			$.displayIssues(settingsDialog, $.settings.PublicationID);
		}
		$.displayStyles(settingsDialog, $.settings.PublicationID);
	}
	$.displayArticleCreationMode = function(settingsDialog) {
		settingsDialog.creationModeDropDownGroup.visible = true;
		var selection = 0;
		var creationMode = 'document';
		if ($.settings.creationMode === 'page') {
			creationMode = 'page';
			selection = 1;
		}
		$.settings.creationMode = creationMode;
		settingsDialog.creationModeDropDownGroup.dropDown.selection = selection;
	}
	$.displayArticleContentOrder = function(settingsDialog) {
		settingsDialog.contentOrderDropDownGroup.visible = true;
		var selection = 0;
		var contentOrder = 'natural';
		if ($.settings.contentOrder === 'textFirst') {
			contentOrder = 'textFirst';
			selection = 1;
		}
		$.settings.contentOrder = contentOrder;
		settingsDialog.contentOrderDropDownGroup.dropDown.selection = selection;
	}
	$.hideAll = function(settingsDialog) {
		$.settings.PublicationID = '';
		$.settings.IssueID = '';
		$.settings.StyleID = '';
		settingsDialog.publicationDropDownGroup.visible = false;
		settingsDialog.issueDropDownGroup.visible = false;
		settingsDialog.creationModeDropDownGroup.visible = false;
		settingsDialog.styleDropDownGroup.visible = false;
		settingsDialog.pagesGroup.visible = false;
	}
	$.renderWindow = function() {
		var valuesWidth = 300;
		var labelWidth = 150;
		$.settingsDialog.endpointDropDownGroup = $.settingsDialog.add('group', undefined, 'endpoint');
		$.settingsDialog.endpointDropDownGroup.orientation = 'row';
		$.settingsDialog.endpointDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Endpoint');
		$.settingsDialog.endpointDropDownGroup.dropDown = $.settingsDialog.endpointDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {
			items: $.mapItemsName($.endpoints)
		});
		var selectedEndpoint = $.endpoints[0];
		if (!$.isInternal) {
			$.settingsDialog.endpointDropDownGroup.visible = false;
			$.settings.endpoint = selectedEndpoint.id;
		} else {
			$.settingsDialog.endpointDropDownGroup.visible = true;
			if (!!$.settings.endpoint) {
				selectedEndpoint = $.getItemByID($.endpoints, $.settings.endpoint);
			}
			$.settingsDialog.endpointDropDownGroup.dropDown.selection = $.getItemIndexByID($.endpoints, selectedEndpoint.id);
			$.settingsDialog.endpointDropDownGroup.dropDown.onChange = function() {
				$.settings.endpoint = $.endpoints[$.settingsDialog.endpointDropDownGroup.dropDown.selection.index].id;
				$.onEndpointChange($.settingsDialog);
			}
		}
		$.canvasflowApi = new CanvasflowApi('http://' + selectedEndpoint.id + '/v2');
		if ($.canvasflowApi.getHealth() === null) {
			throw new Error('Canvasflow Service not currently available');
		}
		$.settingsDialog.apiKeyGroup = $.settingsDialog.add('group');
		$.settingsDialog.apiKeyGroup.orientation = 'row';
		$.settingsDialog.apiKeyGroup.add('statictext', [0, 0, labelWidth, 20], 'API Key');
		$.settingsDialog.apiKeyGroup.apiKey = $.settingsDialog.apiKeyGroup.add('edittext', [0, 0, valuesWidth * 0.72, 20], '');
		$.settingsDialog.apiKeyGroup.testApiKeyBtn = $.settingsDialog.apiKeyGroup.add('button', [0, 0, valuesWidth * 0.25, 20], '&Validate');
		$.settingsDialog.apiKeyGroup.testApiKeyBtn.helpTip = 'Check if the api key is valid and loads the defaults values for the account';
		$.settingsDialog.apiKeyGroup.testApiKeyBtn.shortcutKey = 'v';
		$.settingsDialog.apiKeyGroup.testApiKeyBtn.onClick = function() {
			$.hideAll($.settingsDialog);
			var apiKey = $.settingsDialog.apiKeyGroup.apiKey.text.replace(/\s/g, '');
			$.settingsDialog.apiKeyGroup.apiKey.text = apiKey;
			$.isValidApiKey = $.validateApiKey($.canvasflowApi, apiKey);
			if (!$.isValidApiKey) {
				$.settingsDialog.buttonsBarGroup.saveBtn.visible = false;
				$.hidePublication($.settingsDialog);
				alert('The API key entered is not valid. Please check and try again.');
				return;
			}
			try {
				$.settings.apiKey = apiKey;
				$.displayPublications($.settingsDialog);
				$.displayArticleCreationMode($.settingsDialog);
				$.displayArticleContentOrder($.settingsDialog);
				$.settingsDialog.pagesGroup.visible = true;
				$.settingsDialog.buttonsBarGroup.saveBtn.visible = true;
			} catch (e) {
				logError(e);
			}
		}
		$.settingsDialog.apiKeyGroup.visible = true;
		if (!!$.settings.apiKey) {
			$.settingsDialog.apiKeyGroup.apiKey.text = $.settings.apiKey;
			$.isValidApiKey = $.validateApiKey($.canvasflowApi, $.settings.apiKey)
			if (!$.isValidApiKey) {
				alert('The API key entered is not valid. Please check and try again.');
			}
		}
		$.settingsDialog.apiKeyGroup.apiKey.onChanging = function() {
			$.settingsDialog.buttonsBarGroup.saveBtn.visible = false;
			$.hideAll($.settingsDialog);
		}
		$.settingsDialog.publicationDropDownGroup = $.settingsDialog.add('group', undefined, 'publications');
		$.settingsDialog.publicationDropDownGroup.orientation = 'row';
		$.settingsDialog.publicationDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Publication');
		$.settingsDialog.publicationDropDownGroup.dropDown = $.settingsDialog.publicationDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {
			items: []
		});
		$.settingsDialog.publicationDropDownGroup.visible = false;
		$.settingsDialog.publicationDropDownGroup.dropDown.onChange = function() {
			var selectedPublication = $.publications[$.settingsDialog.publicationDropDownGroup.dropDown.selection.index];
			if (!!$.settings.PublicationID) {
				if ($.settings.PublicationID != selectedPublication.id) {
					$.settings.PublicationID = selectedPublication.id;
					$.onPublicationChange($.settingsDialog, selectedPublication);
				}
			} else {
				$.settings.PublicationID = selectedPublication.id;
				$.onPublicationChange($.settingsDialog, selectedPublication);
			}
		}
		$.settingsDialog.issueDropDownGroup = $.settingsDialog.add('group', undefined, 'issues');
		$.settingsDialog.issueDropDownGroup.orientation = 'row';
		$.settingsDialog.issueDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Issue');
		$.settingsDialog.issueDropDownGroup.dropDown = $.settingsDialog.issueDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {
			items: []
		});
		$.settingsDialog.issueDropDownGroup.visible = false;
		$.settingsDialog.issueDropDownGroup.dropDown.onChange = function() {
			$.settings.IssueID = $.issues[$.settingsDialog.issueDropDownGroup.dropDown.selection.index].id;
		}
		var creationModeOptions = ['Document', 'Page'];
		$.settingsDialog.creationModeDropDownGroup = $.settingsDialog.add('group', undefined, 'creationMode');
		$.settingsDialog.creationModeDropDownGroup.orientation = 'row';
		$.settingsDialog.creationModeDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Article Creation');
		$.settingsDialog.creationModeDropDownGroup.dropDown = $.settingsDialog.creationModeDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {
			items: creationModeOptions
		});
		$.settingsDialog.creationModeDropDownGroup.visible = false;
		$.settingsDialog.creationModeDropDownGroup.dropDown.onChange = function() {
			if ($.settingsDialog.creationModeDropDownGroup.dropDown.selection.index === 0) {
				$.settings.creationMode = 'document';
			} else {
				$.settings.creationMode = 'page';
			}
		}
		var contentOrderOptions = ['Natural'];
		$.settingsDialog.contentOrderDropDownGroup = $.settingsDialog.add('group', undefined, 'contentOrder');
		$.settingsDialog.contentOrderDropDownGroup.orientation = 'row';
		$.settingsDialog.contentOrderDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Content Ordering');
		$.settingsDialog.contentOrderDropDownGroup.dropDown = $.settingsDialog.contentOrderDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {
			items: contentOrderOptions
		});
		$.settingsDialog.contentOrderDropDownGroup.visible = false;
		$.settingsDialog.contentOrderDropDownGroup.dropDown.onChange = function() {
			if ($.settingsDialog.contentOrderDropDownGroup.dropDown.selection.index === 0) {
				$.settings.contentOrder = 'natural';
			} else {
				$.settings.contentOrder = 'textFirst';
			}
		}
		$.settingsDialog.styleDropDownGroup = $.settingsDialog.add('group', undefined, 'styles');
		$.settingsDialog.styleDropDownGroup.orientation = 'row';
		$.settingsDialog.styleDropDownGroup.add('statictext', [0, 0, labelWidth, 20], 'Style');
		$.settingsDialog.styleDropDownGroup.dropDown = $.settingsDialog.styleDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {
			items: []
		});
		$.settingsDialog.styleDropDownGroup.visible = false;
		$.settingsDialog.styleDropDownGroup.dropDown.onChange = function() {
			$.settings.StyleID = '' + $.styles[$.settingsDialog.styleDropDownGroup.dropDown.selection.index].id;
		}
		$.settingsDialog.pagesGroup = $.settingsDialog.add('group');
		$.settingsDialog.pagesGroup.orientation = 'row';
		$.settingsDialog.pagesGroup.add('statictext', [0, 0, labelWidth, 20], 'Publish Pages');
		$.settingsDialog.pagesGroup.pages = $.settingsDialog.pagesGroup.add('edittext', [0, 0, valuesWidth, 20], '');
		$.settingsDialog.pagesGroup.visible = false;
		if (!!$.settings.pages) {
			$.settingsDialog.pagesGroup.pages.text = $.settings.pages;
		}
		if (!!$.isValidApiKey) {
			$.displayPublications($.settingsDialog);
			$.displayArticleCreationMode($.settingsDialog);
			$.displayArticleContentOrder($.settingsDialog);
			$.settingsDialog.pagesGroup.visible = true;
		}
		$.settingsDialog.buttonsBarGroup = $.settingsDialog.add('group', undefined, 'buttons');
		$.settingsDialog.buttonsBarGroup.orientation = 'row';
		$.settingsDialog.buttonsBarGroup.alignChildren = 'bottom';
		$.settingsDialog.buttonsBarGroup.cancelBtn = $.settingsDialog.buttonsBarGroup.add('button', undefined, 'Cancel');
		$.settingsDialog.buttonsBarGroup.saveBtn = $.settingsDialog.buttonsBarGroup.add('button', undefined, 'Save');
		$.settingsDialog.buttonsBarGroup.saveBtn.visible = false;
		if (!!$.isValidApiKey) {
			$.settingsDialog.buttonsBarGroup.saveBtn.visible = true;
		}
		$.settingsDialog.buttonsBarGroup.saveBtn.onClick = function() {
			try {
				$.settings.apiKey = $.settingsDialog.apiKeyGroup.apiKey.text;
				$.settings.endpoint = $.endpoints[0].id;
				if (!!$.isInternal) {
					$.settings.endpoint = $.endpoints[$.settingsDialog.endpointDropDownGroup.dropDown.selection.index].id;
				}
				var pages = $.settingsDialog.pagesGroup.pages.text;
				if (!!pages.length) {
					if (!$.isValidPagesSyntax(pages)) {
						return;
					}
				}
				$.settings.pages = pages;
				if ($.publicationType === 'issue' && !$.settings.IssueID) {
					alert('This Publication has no Issues. Please create an Issue and try again.');
					return
				}
				$.canvasflowSettings.save($.settings);
				$.settingsDialog.close();
			} catch (e) {
				logError(e);
			}
		}
		$.settingsDialog.buttonsBarGroup.cancelBtn.onClick = function() {
			$.settingsDialog.close();
		}
		$.settingsDialog.show();
	};
	$.show = function() {
		try {
			$.settingsDialog.orientation = 'column';
			$.settingsDialog.alignment = 'right';
			$.settingsDialog.preferredSize = $.defaultDialogSize;
			$.renderWindow()
		} catch (e) {
			logError(e);
		}
	};
}
var CanvasflowPublish = function(canvasflowSettings, host, cfBuild, canvasflowApi) {
	var $ = this;
	$.baseDirectory = '';
	$.filePath = '';
	$.uuid = '';
	$.host = host;
	$.canvasflowApi = null;
	$.dialog = {};
	$.pagesRange = null;
	$.cfBuild = cfBuild;
	$.savedSettings = canvasflowSettings.getSavedSettings();
	$.uploadZip = function(filepath) {
		var conn = new Socket;
		var reply = "";
		var host = $.host + ":80"
		var f = File(filepath);
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
		var creationMode = $.savedSettings.creationMode || 'document';
		var contentOrder = $.savedSettings.contentOrder || 'natural';
		if (conn.open(host, "BINARY")) {
			conn.timeout = 20000;
			var boundary = Math.random().toString().substr(2);
			var fileContent = "--" + boundary + "\r\n" +
				"Content-Disposition: form-data; name=\"contentFile\"; filename=\"" + filename + "\"\r\n" +
				"Content-Type: application/octet-stream\r\n" +
				"\r\n" +
				fContent +
				"\r\n";
			var apiKeyContent = "--" + boundary + "\r\n" +
				"Content-Disposition: form-data; name=\"secretKey\"\r\n" +
				"\r\n" +
				apiKey + "\r\n" +
				"\r\n";
			var creationModeContent = "--" + boundary + "\r\n" +
				"Content-Disposition: form-data; name=\"creationMode\"\r\n" +
				"\r\n" +
				creationMode + "\r\n" +
				"\r\n";
			var contentOrderContent = "--" + boundary + "\r\n" +
				"Content-Disposition: form-data; name=\"contentOrder\"\r\n" +
				"\r\n" +
				contentOrder + "\r\n" +
				"\r\n";
			var articleNameContent = "--" + boundary + "\r\n" +
				"Content-Disposition: form-data; name=\"articleName\"\r\n" +
				"\r\n" +
				articleName + "\r\n" +
				"\r\n";
			var PublicationIDContent = "--" + boundary + "\r\n" +
				"Content-Disposition: form-data; name=\"publicationId\"\r\n" +
				"\r\n" +
				PublicationID + "\r\n" +
				"\r\n";
			var IssueIDContent = "--" + boundary + "\r\n" +
				"Content-Disposition: form-data; name=\"issueId\"\r\n" +
				"\r\n" +
				IssueID + "\r\n" +
				"\r\n";
			var StyleIDContent = "--" + boundary + "\r\n" +
				"Content-Disposition: form-data; name=\"styleId\"\r\n" +
				"\r\n" +
				StyleID + "\r\n" +
				"\r\n";
			var contentType = "--" + boundary + "\r\n" +
				"Content-Disposition: form-data; name=\"contentType\"\r\n" +
				"\r\n" +
				"indesign" + "\r\n" +
				"\r\n";
			$.uuid = $.cfBuild.uuid || '';
			var articleIdContent = "--" + boundary + "\r\n" +
				"Content-Disposition: form-data; name=\"articleId\"\r\n" +
				"\r\n" +
				$.uuid + "\r\n" +
				"\r\n";
			var content = fileContent +
				apiKeyContent +
				creationModeContent +
				contentOrderContent +
				articleNameContent +
				contentType +
				PublicationIDContent +
				IssueIDContent +
				StyleIDContent +
				articleIdContent +
				"--" + boundary + "--\r\n\r";
			var cs = "POST /v1/index.cfm?endpoint=/article HTTP/1.1\r\n" +
				"Content-Length: " + content.length + "\r\n" +
				"Content-Type: multipart/form-data; boundary=" + boundary + "\r\n" +
				"Host: " + host + "\r\n" +
				"Authorization: " + apiKey + "\r\n" +
				"Accept: */*\r\n" +
				"\r\n" +
				content;
			conn.write(cs);
			reply = conn.read();
			conn.close();
			if (reply.indexOf("200") > 0) {
				return true;
			} else {
				alert(reply);
				return false;
			}
		} else {
			alert('I couldn\'t connect to the server');
			return false;
		}
	}
	$.getPublication = function() {
		var apiKey = $.savedSettings.apiKey;
		var PublicationID = $.savedSettings.PublicationID;
		var publications = $.canvasflowApi.getPublications(apiKey);
		for (var i = 0; i < publications.length; i++) {
			var publication = publications[i];
			if (publication.id == PublicationID) {
				return publication;
			}
		}
		return null;
	}
	$.getIssue = function() {
		var apiKey = $.savedSettings.apiKey;
		var PublicationID = $.savedSettings.PublicationID;
		var IssueID = $.savedSettings.IssueID;
		var issues = $.canvasflowApi.getIssues(apiKey, PublicationID);
		for (var i = 0; i < issues.length; i++) {
			var issue = issues[i];
			if (issue.id == IssueID) {
				return issue;
			}
		}
		return null;
	}
	$.getStyle = function() {
		var apiKey = $.savedSettings.apiKey;
		var PublicationID = $.savedSettings.PublicationID;
		var StyleID = $.savedSettings.StyleID;
		var styles = $.canvasflowApi.getStyles(apiKey, PublicationID);
		for (var i = 0; i < styles.length; i++) {
			var style = styles[i];
			if (style.id == StyleID) {
				return style;
			}
		}
		return null;
	}
	$.displayConfirmDialog = function() {
		var dialog = new Window('dialog', 'Publish to Canvasflow', undefined, {
			closeButton: false
		});
		dialog.orientation = 'column';
		dialog.alignment = 'right';
		dialog.preferredSize = [300, 100];
		var valuesWidth = 200;
		var labelWidth = 150;
		var endpoint = $.savedSettings.endpoint;
		$.canvasflowApi = new CanvasflowApi('http://' + endpoint + '/v2');
		var intro = 'You are about to publish the current document to Canvasflow. \n\nPlease confirm the following details are correct:';
		dialog.introGroup = dialog.add('statictext', [0, 0, valuesWidth * 1.5, 70], intro, {
			multiline: true
		});
		dialog.introGroup.orientation = 'row:top';
		dialog.introGroup.alignment = 'left';
		dialog.externalIDGroup = dialog.add('group');
		dialog.externalIDGroup.orientation = 'row';
		dialog.externalIDGroup.add('statictext', [0, 0, labelWidth, 20], 'ID');
		dialog.externalIDGroup.add('statictext', [0, 0, labelWidth, 20], $.cfBuild.uuid);
		var publication = $.getPublication();
		dialog.publicationGroup = dialog.add('group');
		dialog.publicationGroup.orientation = 'row';
		dialog.publicationGroup.add('statictext', [0, 0, labelWidth, 20], 'Publication');
		dialog.publicationGroup.add('statictext', [0, 0, labelWidth, 20], publication.name);
		if (publication.type === 'issue') {
			var issue = $.getIssue();
			dialog.issueGroup = dialog.add('group');
			dialog.issueGroup.orientation = 'row';
			dialog.issueGroup.add('statictext', [0, 0, labelWidth, 20], 'Issue');
			dialog.issueGroup.add('statictext', [0, 0, labelWidth, 20], issue.name);
		}
		var style = $.getStyle();
		dialog.styleGroup = dialog.add('group');
		dialog.styleGroup.orientation = 'row';
		dialog.styleGroup.add('statictext', [0, 0, labelWidth, 20], 'Style');
		dialog.styleGroup.add('statictext', [0, 0, labelWidth, 20], style.name);
		dialog.creationModeGroup = dialog.add('group');
		dialog.creationModeGroup.orientation = 'row';
		dialog.creationModeGroup.add('statictext', [0, 0, labelWidth, 20], 'Article Creation');
		var creationMode = $.savedSettings.creationMode[0].toUpperCase() + $.savedSettings.creationMode.slice(1);
		dialog.creationModeGroup.add('statictext', [0, 0, labelWidth, 20], creationMode);
		dialog.buttonsBarGroup = dialog.add('group');
		dialog.buttonsBarGroup.orientation = 'row';
		dialog.buttonsBarGroup.alignChildren = 'bottom';
		dialog.buttonsBarGroup.cancelBtn = dialog.buttonsBarGroup.add('button', undefined, 'Cancel');
		dialog.buttonsBarGroup.saveBtn = dialog.buttonsBarGroup.add('button', undefined, 'OK');
		dialog.buttonsBarGroup.saveBtn.onClick = function() {
			dialog.close(1);
		}
		dialog.buttonsBarGroup.cancelBtn.onClick = function() {
			dialog.close(0);
		}
		return dialog.show();
	}
	$.publish = function() {
		if (canvasflowApi.getHealth() === null) {
			throw new Error('Canvasflow Service not currently available');
		}
		if (app.documents.length != 0) {
			var zipFilePath = '';
			var response = $.displayConfirmDialog();
			if (!!response) {
				var baseDirectory = app.activeDocument.filePath + '/';
				$.filePath = baseDirectory + app.activeDocument.name;
				var ext = app.activeDocument.name.split('.').pop();
				$.baseDirectory = baseDirectory + app.activeDocument.name.replace("." + ext, '');
				zipFilePath = cfBuild.build();
				if (!cfBuild.isBuildSuccess) {
					alert('Build cancelled');
					return;
				}
				var publishStartTime = (new Date()).getTime();
				if ($.uploadZip(zipFilePath)) {
					new File(zipFilePath).remove()
					alert('Success \nThe file has been published to Canvasflow');
					logger.log((new Date()).getTime() - publishStartTime, 'Publishing')
				} else {
					logger.log((new Date()).getTime() - publishStartTime, 'Publishing with error')
					throw new Error('Error uploading the content, please try again');
				}
			}
		} else {
			alert('Please select an article to Publish');
		}
	}
}
var CanvasflowPlugin = function() {
	var $ = this;
	$.install = function() {
		try {
			app.menus.item("$ID/Main").submenus.item("Canvasflow").remove();
		} catch (e) {
		}
		var canvasflowScriptActionSettings = app.scriptMenuActions.add("&Settings");
		canvasflowScriptActionSettings.eventListeners.add("onInvoke", function() {
			var settingsFile = new File(settingsFilePath);
			if (!settingsFile.parent.exists) {
				alert('Please run the Install command, help please refer to the help documentation');
				return;
			}
			logger.log((new Date()).getTime(), '-----------     START     -----------');
			var canvasflowDialog = new CanvasflowDialog(settingsFilePath, isInternal);
			canvasflowDialog.show();
			logger.log((new Date()).getTime(), '-----------     END     -----------');
		});
		var canvasflowScriptActionPublish = app.scriptMenuActions.add("&Publish");
		canvasflowScriptActionPublish.eventListeners.add("onInvoke", function() {
			var settingsFile = new File(settingsFilePath);
			if (!settingsFile.exists) {
				alert('Please open Settings first and register the api key');
				return;
			}
			try {
				settingsFile.open('r');
				var settings = JSON.parse(settingsFile.read());
				if (!settings.endpoint) {
					alert('Please select an endpoint')
					return;
				}
				if (!settings.apiKey) {
					alert('Please register the api key in Settings')
					return;
				}
				if (!settings.PublicationID) {
					alert('Please select a publication in Settings')
					return;
				}
				var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
				var canvasflowBuild = new CanvasflowBuild(canvasflowSettings, resizeCommandFilePath, convertCommandFilePath, os);
				var canvasflowApi = new CanvasflowApi('http://' + settings.endpoint + '/v2');
				var canvasflowPublish = new CanvasflowPublish(canvasflowSettings, settings.endpoint, canvasflowBuild, canvasflowApi);
				logger.log((new Date()).getTime(), '-----------     START     -----------');
				canvasflowPublish.publish();
				logger.log((new Date()).getTime(), '-----------     END     -----------');
			} catch (e) {
				logError(e);
			}
		});
		var canvasflowScriptActionBuild = app.scriptMenuActions.add("&Build");
		canvasflowScriptActionBuild.eventListeners.add("onInvoke", function() {
			try {
				if (app.documents.length != 0) {
					var response = confirm('Do you wish to proceed? \nThis will generate the deliverable ZIP file, but will NOT publish to Canvasflow.\n\nPlease do this only if instructed by a member of the Canvasflow support team.')
					if (response) {
						var canvasflowSettings = new CanvasflowSettings(settingsFilePath);
						var canvasflowBuild = new CanvasflowBuild(canvasflowSettings, resizeCommandFilePath, convertCommandFilePath, os);
						logger.log((new Date()).getTime(), '-----------     START     -----------');
						var buildFile = new File(canvasflowBuild.build());
						logger.log((new Date()).getTime(), '-----------     END     -----------');
						if (canvasflowBuild.isBuildSuccess) {
							alert('Build Completed\n' + buildFile.displayName);
							buildFile.parent.execute()
						} else {
							alert('Build cancelled');
						}
					}
				} else {
					alert('Please select an article to build');
				}
			} catch (e) {
				logError(e);
			}
		});
		var canvasflowScriptActionAbout = app.scriptMenuActions.add("&About");
		canvasflowScriptActionAbout.eventListeners.add("onInvoke", function() {
			try {
				var canvasflowAbout = new CanvasflowAbout(version);
				canvasflowAbout.show();
			} catch (e) {
				logError(e);
			}
		});
		var canvasflowScriptMenu = null;
		try {
			canvasflowScriptMenu = app.menus.item("$ID/Main").submenus.item("Canvasflow");
			canvasflowScriptMenu.title;
		} catch (e) {
			canvasflowScriptMenu = app.menus.item("$ID/Main").submenus.add("Canvasflow");
		}
		canvasflowScriptMenu.menuItems.add(canvasflowScriptActionPublish);
		canvasflowScriptMenu.menuItems.add(canvasflowScriptActionSettings);
		canvasflowScriptMenu.menuSeparators.add(LocationOptions.AT_END);
		canvasflowScriptMenu.menuItems.add(canvasflowScriptActionBuild);
		canvasflowScriptMenu.menuSeparators.add(LocationOptions.AT_END);
		canvasflowScriptMenu.menuItems.add(canvasflowScriptActionAbout);
	}
}
var canvasflowPlugin = new CanvasflowPlugin();
canvasflowPlugin.install();