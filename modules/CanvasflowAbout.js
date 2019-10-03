var CanvasflowAbout = function(version) {
    var $ = this;
    $.version = version;

    $.show = function() {
        alert('Version: ' + version);
    }
}