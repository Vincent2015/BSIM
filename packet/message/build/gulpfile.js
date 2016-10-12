var gulp = require('gulp');
var header = require('gulp-header');
var footer = require('gulp-footer');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var cached = require('gulp-cached');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var remember = require('gulp-remember');

var scriptsGlob = '../cache/**/*.js';

gulp.task('scripts', function() {
  return gulp.src(scriptsGlob)
      .pipe(cached('scripts'))        // 只传递更改过的文件
      .pipe(jshint())                 // js代码检查,对这些更改过的文件做一些特殊的处理...
//    .pipe(header('var YYIMCache = (function () {')) // 比如 jshinting ^^^
//    .pipe(footer('})();'))          // 增加一些类似模块封装的东西
//  	.pipe(jshint.reporter()); // 输出检查结果
			.pipe(remember('scripts'))      // 把所有的文件放回 stream
      .pipe(concat('YYIMCache.js'))         // 做一些需要所有文件的操作
      .pipe(gulp.dest('../cache/'))
//  	.pipe(rename('YYIMCache.min.js'))
//    .pipe(uglify())
//    .pipe(gulp.dest('../cache/'));
});

gulp.task('watch', function () {
  var watcher = gulp.watch(scriptsGlob, ['scripts']); // 监视与 scripts 任务中同样的文件
  watcher.on('change', function (event) {
    if (event.type === 'deleted') {                   // 如果一个文件被删除了，则将其忘记
      delete cached.caches.scripts[event.path];       // gulp-cached 的删除 api
      remember.forget('scripts', event.path);         // gulp-remember 的删除 api
    }
  });
});


gulp.task('default', function(){
    gulp.run('scripts','watch');
});

//gulp.task('default',['scripts', 'watch'],function(){
//	
//});