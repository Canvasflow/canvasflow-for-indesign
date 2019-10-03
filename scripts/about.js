//@include "./../modules/CanvasflowAbout.js"

var version = '0.1.0';
var canvasflowAbout = new CanvasflowAbout(version);
try {
    canvasflowAbout.show();
} catch(e) {
    alert(e.message);
}

