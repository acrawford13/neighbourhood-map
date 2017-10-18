var gulp = require('gulp');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();

gulp.task('serve', ['css','html','js'], function() {
    browserSync.init({
        server: "dist"
    });

    gulp.watch('src/**', ['js','css','html']);
    gulp.watch("dist/**").on('change', browserSync.reload);
});

gulp.task('css', function(){
    gulp.src('src/scss/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream());
});

gulp.task('html', function(){
    gulp.src('src/index.html')
        .pipe(gulp.dest('dist/'))
});

gulp.task('js', function(){
    gulp.src('src/js/*.js')
        .pipe(gulp.dest('dist/js/'))
});

gulp.task('build', ['html','css'], function(){
    gulp.src('node_modules/knockout/build/output/knockout-latest.js')
        .pipe(rename('knockout.js'))
        .pipe(gulp.dest('dist/js/vendor/'));
});

gulp.task('build:dev', ['html','css'], function(){
    gulp.src('node_modules/knockout/build/output/knockout-latest.debug.js')
        .pipe(rename('knockout.js'))
        .pipe(gulp.dest('dist/js/vendor/'));
});
