//@include "./../modules/json2.js"
//@include "./../modules/Array.js"

var words = ['spray', 'limit', 'elite', 'exuberant', 'destruction', 'present'];

const result = words.filter(function(word) { return word.length > 6 });

var foo = {
    bar: 'x',
    foo: '4',
    x: true,
    y: 20.00
}
 var keys = [];

 for(var k in foo) {
    keys.push(k);
 }

 alert(JSON.stringify(['x'].concat(['y', 'z'])));