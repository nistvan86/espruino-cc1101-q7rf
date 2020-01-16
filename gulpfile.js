var gulp = require('gulp');
var replace = require('gulp-string-replace');
const { fork } = require('child_process');
var rollup = require('gulp-better-rollup');
var rollupUglify = require('rollup-plugin-uglify').uglify;
var rollupTypescript = require('rollup-plugin-typescript');
var uglify = require('uglify-js');

gulp.task('build', function (cb) {
  gulp
    .src('./src/app.ts')
    .pipe(rollup({
      plugins: [
        rollupTypescript(),
        rollupUglify({ compress: true }, uglify)
      ]
    }, {
      format: 'cjs',
      file: './built/app.js'
    }))
    .pipe(replace(/[\'\"]use strict[\'\"]\;\n*/, ''))
    .pipe(gulp.dest('./built'))
    .on('end', () => cb());
});

gulp.task('upload', gulp.series(['build'], function (cb) {
  const buildproc = fork(
    require.resolve('espruino/bin/espruino-cli'),
    ['--board', 'ESP8266_4MB',
      '-b', 115200,
      '--port', '/dev/ttyUSB0',
      '--config', 'SAVE_ON_SEND=1',
      './built/app.js']
  );
  buildproc.on('close', () => cb());
}));
