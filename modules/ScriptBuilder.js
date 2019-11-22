//@include "env.js"
var ScriptBuilder = function(os, baseDirName) {
    var $ = this;
    
    $.os = os;
    $.baseDirName = baseDirName;
    $.getResizeImageScript = function(files, resizingImageLockFilePath, shouldDeleteFiles) {
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
                '#!/bin/bash',
                "CYAN='\033[1;36m'",
                "NC='\033[0m'",
                "GREEN='\033[1;32m'",
                "YELLOW='\033[0;33m'",
                "RED='\033[0;31m'",
                'clear',
                'files=( ' + files.join(' ') + ' )',
                'should_delete_files=( ' + shouldDeleteFiles.join(' ') + ' )',
                'total_of_images=${#files[@]}',
                'processed_images=0',
                'index=0',
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
                // '\t\tclear',
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
                '\t\tshould_delete=${should_delete_files[${index}]}',
                '\t\tif $should_delete; then',
                '\t\t\tremove_command="rm \\\"${file}\\\""',
                '\t\t\teval $remove_command',
                '\t\tfi',
                '\t\tindex=${index}+1;',
                'done',
                'rm -f ' + resizingImageLockFilePath
            ];
        }

        return lines;
    }
    $.getConvertImageScript = function(files, convertImageLockFilePath) {
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
                'rm -f ' + convertImageLockFilePath
            ]
        }

        return lines;
    }
}