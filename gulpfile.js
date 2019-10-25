const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const concat = require('gulp-concat');
const strip = require('gulp-strip-comments');
const beautify = require('gulp-beautify');
const removeEmptyLines = require('gulp-remove-empty-lines');
const buildPath = process.env.BUILD_PATH || path.join(__dirname, 'build');
const package = require('./package.json');

function concatenate() {
    
    return gulp.src([
        './modules/json2.js', 
        './modules/Array.js', 
        './modules/env.js',
        './modules/dir.js',
        './modules/error.js',
        './modules/variables.js',
        './modules/timeout.js',
        './modules/Logger.js',
        './modules/http.js',
        './modules/CanvasflowApi.js',
        './modules/AboutDialog.js',
        './modules/Build.js',
        './modules/Settings.js',
        './modules/SettingsDialog.js',
        './modules/Publisher.js',
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
    .pipe(gulp.dest(buildPath));
}

function prependEngine(cb) {
    const filePath = path.join(buildPath, 'Canvasflow.jsx');
    var fileContent = fs.readFileSync(filePath, 'utf-8');
    fs.writeFileSync(filePath, `#targetengine "session" \n\nvar version='${package.version}'; \n\n ${fileContent}`)
    cb();
}
exports.default = gulp.series(concatenate, prependEngine);