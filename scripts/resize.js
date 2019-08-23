function resizeImages(imageFiles, commandFilePath) {
    var dataFile = new File(commandFilePath);
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
        dataFile.writeln('total_of_images=${#files[@]}');
        dataFile.writeln('processed_images=0');
        dataFile.writeln('for file in "${files[@]}"');
        dataFile.writeln('\tdo :');
        dataFile.writeln('\t\tprocessed_images=$((processed_images+1))');
        dataFile.writeln('\t\techo "Optimizing images ${processed_images}/${total_of_images}"');
        dataFile.writeln('\t\text="${file#*.}"');
        dataFile.writeln('\t\tfilename=$(basename -- \"$file\")');
        dataFile.writeln('\t\tfilename="${filename%.*}"');
        dataFile.writeln('\t\timage_width="$({ sips -g pixelWidth \"$file\" || echo 0; } | tail -1 | sed \'s/[^0-9]*//g\')"');
        dataFile.writeln('\t\tif [ "$image_width" -gt "2048" ]; then');
        dataFile.writeln('\t\t\tparent_filename="$(dirname "${file})")"');
        dataFile.writeln('\t\t\ttarget_filename="${parent_filename}/${filename}.jpg"');
        dataFile.writeln('\t\t\tresize_command="sips -s formatOptions 1 --matchTo \'/System/Library/ColorSync/Profiles/sRGB Profile.icc\' --resampleWidth 2048 -s format jpeg \\\"${file}\\\" --out \\\"${target_filename}\\\"" ');
        dataFile.writeln('\t\t\teval $resize_command > /dev/null 2>&1');
        dataFile.writeln('\t\t\tclear');
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

function convertImages(imageFiles, commandFilePath) {
    var dataFile = new File(commandFilePath);
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
        dataFile.writeln("RED='\033[0;31m'");
        dataFile.writeln("NC='\033[0m'");
        dataFile.writeln('total_of_images=${#files[@]}');
        dataFile.writeln('processed_images=0');
        dataFile.writeln('for file in "${files[@]}"');
        dataFile.writeln('\tdo :');
        dataFile.writeln('\t\tprocessed_images=$((processed_images+1))');
        dataFile.writeln('\t\techo "Converting images ${RED}${processed_images}${NC}/${total_of_images}"');
        dataFile.writeln('\t\text="${file#*.}"');
        dataFile.writeln('\t\tfilename=$(basename -- \"$file\")');
        dataFile.writeln('\t\tfilename="${filename%.*}"');
        dataFile.writeln('\t\tparent_filename="$(dirname "${file})")"');
        dataFile.writeln('\t\ttarget_filename="${parent_filename}/${filename}.jpg"');
        dataFile.writeln('\t\tconvert_command="sips -s format jpeg \\\"${file}\\\" --matchTo \'/System/Library/ColorSync/Profiles/sRGB Profile.icc\' --out \\\"${target_filename}\\\""');
        dataFile.writeln('\t\teval $convert_command > /dev/null 2>&1');
        dataFile.writeln('\t\tclear');
        dataFile.writeln('\t\tremove_command="rm \\\"${file}\\\""');
        dataFile.writeln('\t\teval $remove_command');
        dataFile.writeln('done');
        // dataFile.writeln(closeTerminalCommand);

        dataFile.execute();
        dataFile.close();
}

var imageFiles = ['/Users/jjzcru/Pictures/Wallpaper copy/2.tif'];
var commandFilePath = '~/resize.command';
// resizeImages(imageFiles, commandFilePath);
imageFiles = ['/Users/jjzcru/Downloads/FIN_180619_010-011 Folder/FIN_180619_010-011-2/images/14914.bmp'];
convertImages(imageFiles, commandFilePath);
