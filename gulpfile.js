var gulp = require('gulp');
var replace = require("gulp-string-replace");
var ts = require('gulp-typescript');
 
gulp.task('build', function () {
    var tsProject = ts.createProject('tsconfig.json', { noImplicitAny: true });
    return tsProject.src()
        .pipe(tsProject())
        .pipe(replace(/[\'\"]use strict[\'\"]\;\n*/, ''))
        .pipe(gulp.dest('built'));
});