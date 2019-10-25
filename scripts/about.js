//@include "./../modules/AboutDialog.js"

var version = '0.1.0';
var canvasflowAbout = new AboutDialog(version);
try {
    canvasflowAbout.show();
} catch(e) {
    alert(e.message);
}

