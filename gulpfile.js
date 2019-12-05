const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const ts = require('gulp-typescript');
const beautify = require('gulp-beautify');
const buildPath = process.env.BUILD_PATH || path.join(__dirname, 'build');
const package = require('./package.json');
const tsProject = ts.createProject('tsconfig.json');
const format = require("string-template")

function prependEngine(cb) {
    const filePath = path.join(buildPath, 'Canvasflow.jsx');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    fs.writeFileSync(filePath,`//@targetengine "session"\n\nvar version='${package.version}'; \n\n ${fileContent}`);
    cb();
}

function createInstallScript(cb) {
    let installScriptFilePath = path.join(__dirname, 'scripts', 'install.sh');
    if(fs.existsSync(installScriptFilePath)) {
        fs.unlinkSync(installScriptFilePath)
    }
    fs.writeFileSync(installScriptFilePath, '', 'utf-8');

    const installTemplatePath = path.join(__dirname, 'templates', 'install.txt');

    const scriptContent = fs.readFileSync(installTemplatePath, 'utf-8');
    fs.writeFileSync(installScriptFilePath, format(scriptContent, { version: package.version}));
    cb();
}

function build() {
    return gulp.src([
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
    .pipe(
      beautify({
        indent_size: 4,
        indent_with_tabs: true
      })
    )
    .pipe(gulp.dest('build'));
}

const buildTask = gulp.series(build, prependEngine, createInstallScript);

gulp.task('default', buildTask);
gulp.task('build', buildTask);
gulp.task('watch', () => gulp.watch('src/**', buildTask));