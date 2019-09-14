const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const concat = require('gulp-concat');
var strip = require('gulp-strip-comments');
var beautifyCode = require('gulp-beautify-code');
var beautify = require('gulp-beautify');
var removeEmptyLines = require('gulp-remove-empty-lines');

function concatenate() {
    return gulp.src([
        './modules/json2.js', 
        './modules/error.js',
        './modules/variables.js',
        './modules/timeout.js',
        './modules/logger.js',
        './modules/http.js',
        './modules/api.js',
        './modules/build.js',
        './modules/settings.js',
        './modules/dialog.jsx',
        './modules/publish.jsx',
        './modules/main.js',
    ])
    .pipe(concat('Canvasflow.jsx'))
    .pipe(strip())
    .pipe(beautifyCode())
    .pipe(beautify({ 
        indent_size: 4 
    }))
    .pipe(removeEmptyLines({
        removeComments: true
      }))
    .pipe(gulp.dest('./build/'));
}

function prependEngine(cb) {
    const filePath = path.join(__dirname, 'build', 'Canvasflow.jsx');
    var fileContent = fs.readFileSync(filePath, 'utf-8');
    fs.writeFileSync(filePath, `#targetengine "session" \n\n ${fileContent}`)
    cb();
}
exports.default = gulp.series(concatenate, prependEngine);