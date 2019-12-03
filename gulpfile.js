const fs = require("fs");
const path = require("path");

const gulp = require("gulp");
const ts = require('gulp-typescript');
const strip = require("gulp-strip-comments");
const beautify = require("gulp-beautify");
const removeEmptyLines = require("gulp-remove-empty-lines");
const buildPath = process.env.BUILD_PATH || path.join(__dirname, "build");
const package = require("./package.json");
const tsProject = ts.createProject('tsconfig.json');

function prependEngine(cb) {
    const filePath = path.join(buildPath, "Canvasflow.jsx");
    var fileContent = fs.readFileSync(filePath, "utf-8");
    fs.writeFileSync(filePath,`//@targetengine "session"\n\nvar version='${package.version}'; \n\n ${fileContent}`);
    cb();
}

function build() {
    const tsResult =  gulp.src([
        'src/polyfills/*.js',  
        'src/helper/*.js',
        'src/modules/Variables.ts',
        'src/modules/Logger.ts',
        'src/modules/CanvasflowApi.ts',
        'src/modules/LogDialog.ts',
        'src/modules/AboutDialog.ts',
        'src/modules/ScriptBuilder.ts',
        'src/modules/Builder.ts',
        'src/modules/Settings.ts',
        'src/modules/SettingsDialog.ts',
        'src/modules/MissingImagesDialog.ts',
        'src/modules/Publisher.ts',
        'src/modules/CanvasflowPlugin.ts'
    ])
    .pipe(tsProject())
    
    return tsResult.js
      .pipe(strip())
      .pipe(
        beautify({
          indent_size: 4,
          indent_with_tabs: true
        })
      )
      .pipe(
        removeEmptyLines({
          removeComments: true
        })
      )
      .pipe(gulp.dest('build'));
}

const buildTask = gulp.series(build, prependEngine);

gulp.task("default", buildTask);
gulp.task("build", buildTask);
gulp.task("watch", function() {
  return gulp.watch("src/**", buildTask);
});