//@include "./../modules/json2.js"
//@include "./../modules/Array.js"

/*var words = ['spray', 'limit', 'elite', 'exuberant', 'destruction', 'present'];

const result = words.filter(function(word) { return word.length > 6 });

alert(JSON.stringify(result));*/

function isNotSupportedExtension(ext) {
    var exts=[
        'jpg',
        'jpeg',
        'eps',
        'tiff',
        'tif',
        'png',
        'gif',
        'jp2',
        'pict',
        'bmp',
        'qtif',
        'psd',
        'sgi',
        'tga'
    ];
​
    return exts.indexOf(ext) != -1;
}

alert(isNotSupportedExtension('xxx'))