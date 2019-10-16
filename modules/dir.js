function isDir(file) {
    // If the property exist then is a file
    if(!!file.lineFeed) {
        return false
    }
    return true;
}
function removeDir(dirPath) {
    var dir = new Folder(dirPath);
    var files = dir.getFiles();
    if(!!files.length) {
        for(var i = 0; i < files.length; i++) {
            var file = files[i];
            if(isDir(file)) {
                removeDir(file.fsName)
            } else {
                file.remove()
            }
        }
    }
    dir.remove();
}