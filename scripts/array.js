//@include "./../modules/json2.js"
//@include "./../modules/Array.js"

var words = ['spray', 'limit', 'elite', 'exuberant', 'destruction', 'present'];

const result = words.filter(function(word) { return word.length > 6 });

alert(JSON.stringify(result));