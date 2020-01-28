//@include "json2.js"
var pages = [];
for(var i=0; i < document.pages.length; i++) {
    var page = document.pages[i];
    pages.push(page.name);
}

alert(JSON.stringify(pages));