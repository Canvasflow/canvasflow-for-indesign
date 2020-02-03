var page = app.activeDocument.pages[0];
var graphic = page.allGraphics[0];
var bounds = graphic.visibleBounds;

var height = bounds [2] - bounds[0];
var width = bounds [3] - bounds[1];
const imageRepresentation = {
    width: width,
    height: height,
    boundaries: bounds
}
var bounds = getItemPosition(graphic.geometricBounds);
// alert(graphic.geometricBounds);
alert('Width: ' + bounds.width + '\nHeight: ' + bounds.height + '\nX: ' + bounds.x + '\nY: ' + bounds.y);


// -382.4,-194.8,1009.6,1105.2

function getItemPosition(bounds) {
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
    };
}
