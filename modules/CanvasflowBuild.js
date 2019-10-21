//@include "json2.js"
//@include "timeout.js"
//@include "env.js"
//@include "dir.js"

var CanvasflowBuild = function(canvasflowSettings, resizeCommandFilePath, convertCommandFilePath, os) {
    var $ = this;

    $.resizeCommandFilePath = resizeCommandFilePath || '';
    $.convertCommandFilePath = convertCommandFilePath || '';
    
    $.os = os;
    $.imagesToResize = [];
    $.imagesToConvert = [];
    $.imageSizeCap = 1.5 * 1000000; // 1.5Mb
    $.baseDirName = 'cf-indesign'

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

    $.getRealCharacter = function(content) {
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
                    }
                }
                continue;
            }

            var previousFontStyle = substring.font.fontStyle;
            var currentFontStyle = 'Regular';
            try {
                currentFontStyle = character.appliedFont.fontStyleName || 'Regular';
            } catch(e) {}

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

            var content = $.getRealCharacter(character.contents);

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

    $.isNotSupportedExtension = function(ext) {
        switch(ext) {
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
        if(ext === 'jpg' || ext === 'jpeg') {
            ext = 'jpg';
        }

        destFilePath = imageDirectory + '/' + id + '.' + ext;
        destFilePath = destFilePath.replace(/%20/gi, ' ');

        if($.isNotSupportedExtension(ext)) {
            return $.exportImageRepresentation(graphic, imageDirectory, id);
        }

        if(!originalImageFile.exists) {
            if(!!logger) {
                logger.log((new Date()).getTime(), 'The image do not exist: "' + fileName + '"');
            }
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
            var dataFile = new File($.resizeCommandFilePath);
            if(!dataFile.exists) {
                throw new Error('The command required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@cvanvasflow.io if you require assistance.');
            }
            $.imagesToResize.push(File(imageDirectory + '/' + id + '.' + ext).fsName);
            return '' + id + '.' + targetExt;
        }
        
        if(targetExt !== ext) {
            var dataFile = new File($.convertCommandFilePath);
            if(!dataFile.exists) {
                throw new Error('The command required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@cvanvasflow.io if you require assistance.');
            }
            $.imagesToConvert.push(File(imageDirectory + '/' + id + '.' + ext).fsName);
        }
               
        return '' + id + '.' + targetExt;
    }

    $.getImageFromGraphics = function(graphics, data, baseDirectory) {
        var imageDirectory = baseDirectory + '/images';
        if(graphics.length > 0) {
            for (var i = 0; i < graphics.length; i++) {
                var graphic = graphics[i];
                if(graphic.isValid) {
                    var imagePath;
                    var position = $.getItemPosition(graphic.parent.geometricBounds);
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
                    }
                }
            }
        }
    }

    $.getImages = function(page, data, baseDirectory) {
        $.getImageFromGraphics(page.allGraphics, data, baseDirectory);
    }

    $.writeToFileScript = function(dataFile, lines) {
        for(var i=0; i < lines.length; i++) {
            var line = lines[i];
            dataFile.writeln(line);
        }
    }
    $.getResizeImagesScriptContent = function(files) {
        var lines = [];
        if($.os === 'dos') {
            var basePath = 'userprofile';
            if(!!getEnv('CF_USER_BASE_PATH')) {
                basePath = 'cf_user_base_path';
            }
            lines.push(
                '@echo off',
                'setlocal enabledelayedexpansion'
            )
            for(var i = 0; i < files.length; i++) {
                lines.push('set Files['+i+']="'+files[i]+'"')
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
        if(!dataFile.exists) {
            throw new Error('The command required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@cvanvasflow.io if you require assistance.');
        }
    
        var files = [];
        for(var i = 0; i < imageFiles.length; i++) {
            if($.os === 'dos') {
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
        if($.os === 'dos') {
            var basePath = 'userprofile';
            if(!!getEnv('CF_USER_BASE_PATH')) {
                basePath = 'cf_user_base_path';
            }
            lines.push(
                '@echo off',
                'setlocal enabledelayedexpansion'
            )
            for(var i = 0; i < files.length; i++) {
                lines.push('set Files['+i+']="'+files[i]+'"')
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

        if(!dataFile.exists) {
            throw new Error('The command required to process images has not been correctly executed.  Please refer to the plugin documentation before attempting to publish again.  Please contact support@cvanvasflow.io if you require assistance.');
        }

        var files = [];
        for(var i = 0; i < imageFiles.length; i++) {
            if($.os === 'dos') {
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

    $.createPackage = function(baseFile) {
        try {
            var resizingLockFile = new File($.resizingImageLockFilePath)
            var convertLockFile = new File($.convertImageLockFilePath)
            if(!resizingLockFile.exists && !convertLockFile.exists) {
                app.packageUCF(baseFile.fsName, baseFile.fsName + '.zip', 'application/zip');
                return;
            }

            setTimeout(function() {
                $.createPackage(baseFile);
            }, 1000);
        } catch(e) {
            setTimeout(function() {
                $.createPackage(baseFile);
            }, 1000);
        }
    }

    $.cleanLocks = function() {
        var lockFile = new File($.resizingImageLockFilePath)
		if(lockFile.exists) {
			lockFile.remove();
        }
        
        lockFile = new File($.convertImageLockFilePath)
		if(lockFile.exists) {
			lockFile.remove();
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

        var baseFile = new File(baseDirectory);

        $.cleanLocks();

        if(!!$.imagesToResize.length) { 
            var lockFile = new File($.resizingImageLockFilePath)
            lockFile.encoding = 'UTF-8';
            lockFile.open('w');
            lockFile.close();
            $.resizeImages($.imagesToResize);
        }
        
        if(!!$.imagesToConvert.length) {
            var lockFile = new File($.convertImageLockFilePath)
            lockFile.encoding = 'UTF-8';
            lockFile.open('w');
            lockFile.close();
            $.convertImages($.imagesToConvert);
        }

        $.createPackage(baseFile);
        removeDir(baseFile.fsName);

        return baseFile.fsName + '.zip';
    }

    $.getDefaultPages = function() {
        var pages = [];
        for(var i = 0; i < document.pages.length; i++) {
            pages.push(i+1);
        }
        return pages;
    }

    $.getRangePages = function(input) {
        var pages = [];
        results = /^([0-9]+)(-)+([0-9]+)$/.exec(input);
        var lowerRange = parseInt(results[1]);
        var higherRange = parseInt(results[3]);
        var totalOfPages = document.pages.length;

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

        initialPageIndex = lowerRange ;
        lastPageIndex = higherRange;
            
        if (higherRange > totalOfPages) {
            lastPageIndex = totalOfPages
        }

        for(var i=initialPageIndex; i <= lastPageIndex; i++) {
            pages.push(i);
        }

        return pages;
    }

    $.isElementExist = function(arr, element) {
        for(var i = 0; i < arr.length; i++) {
            if(arr[i] === element) return true;
        }
        return false;
    }

    $.getUniqueArray = function(arr) {
        var response = [];
        for(var i = 0; i < arr.length; i++) {
            var element = arr[i];
            if(!$.isElementExist(response, element)) {
                response.push(element);
            }
        }
        return response;
    }

    $.getCSVPages = function(input) {
        var pages = [];
        var pagesString = input.split(',');
        for(var i=0; i < pagesString.length; i++) {
            var pageNumber = parseInt(pagesString[i]);
            if(!!pageNumber) {
                pages.push(pageNumber);
            }
        }
        pages = $.getUniqueArray(pages);
        return pages;
    }

    $.build = function() {
        var baseDirectory = app.activeDocument.filePath + '/';
        $.filePath = baseDirectory + app.activeDocument.name;
        var ext = app.activeDocument.name.split('.').pop();
        $.baseDirectory = baseDirectory + app.activeDocument.name.replace("." + ext, '');

        $.createExportFolder();

        var canvasflowBaseDir = new Folder(getBasePath() + '/' + $.baseDirName);
        if(!canvasflowBaseDir.exists) {
            canvasflowBaseDir.create();
        }
        
        baseDirectory = $.baseDirectory;
        var filePath = $.filePath;
            
        var templateFile = new File(filePath);
        templateFile.open('r');
            
        var document = app.activeDocument;
        var zeroPoint =  document.zeroPoint;
        document.zeroPoint = [0, 0];
            
        $.uuid = $.getDocumentID(document);
        var response = {
            pages: []
        };

        var settingPages = $.savedSettings.pages;

        var pages = $.getDefaultPages();

        if(!!settingPages) {
            if(!!/^([0-9]+)(-)+([0-9]+)$/.exec(settingPages)) {
                pages = $.getRangePages(settingPages);
            } else if(!!/^(\d)+(,\d+)*$/.exec(settingPages)) {
                pages = $.getCSVPages(settingPages);
            } else {
                throw new Error('The range for pages has an invalid syntax');
            }
        }

        // This set the document to pixels
        app.activeDocument.viewPreferences.horizontalMeasurementUnits = 2054187384;
        app.activeDocument.viewPreferences.verticalMeasurementUnits = 2054187384;
        var w = new Window ('palette', 'Processing pages');
        w.progressBar = w.add('progressbar', undefined, 0, pages.length);
        w.progressText = w.add('statictext', [0, 0, 100, 20], '');
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
        } while(pages.length !== 0)

        document.zeroPoint = zeroPoint;

        return $.buildZipFile(document, response, baseDirectory);
    }
}