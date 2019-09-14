const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const concat = require('gulp-concat');
const strip = require('gulp-strip-comments');
const beautify = require('gulp-beautify');
const removeEmptyLines = require('gulp-remove-empty-lines');

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
        './modules/dialog.js',
        './modules/publish.js',
        './modules/main.js',
    ])
    .pipe(concat('Canvasflow.jsx'))
    .pipe(strip())
    .pipe(beautify({ 
        indent_size: 4,
        indent_with_tabs: true
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