var gulp = require('gulp');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();

gulp.task('serve', ['css','html','js','img'], function() {
    browserSync.init({
        server: "dist"
    });

    gulp.watch('src/**', ['js','css','html','img']);
    gulp.watch("dist/**").on('change', browserSync.reload);
});

gulp.task('css', function(){
    gulp.src('node_modules/jquery.scrollbar/jquery.scrollbar.css')
        .pipe(gulp.dest('dist/css/vendor/'));
    gulp.src('node_modules/normalize.css/normalize.css')
        .pipe(gulp.dest('dist/css/vendor/'));
    gulp.src('src/scss/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream());
});

gulp.task('html', function(){
    gulp.src('src/index.html')
        .pipe(gulp.dest('dist/'))
});

gulp.task('img', function(){
    gulp.src('src/img/**')
        .pipe(gulp.dest('dist/img/'))
});

gulp.task('js', function(){
    gulp.src('node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest('dist/js/vendor/'));
    gulp.src('node_modules/jquery.scrollbar/jquery.scrollbar.min.js')
        .pipe(gulp.dest('dist/js/vendor/'));
    gulp.src('src/js/**')
        .pipe(gulp.dest('dist/js/'))
});

gulp.task('fonts', function(){
    gulp.src('node_modules/font-awesome/fonts/**')
        .pipe(gulp.dest('dist/fonts/'))
});

gulp.task('build', ['html','img','js','css','fonts'], function(){
    gulp.src('node_modules/knockout/build/output/knockout-latest.js')
        .pipe(rename('knockout.js'))
        .pipe(gulp.dest('dist/js/vendor/'));
});

gulp.task('build:dev', ['html','img','js','css','fonts'], function(){
    gulp.src('node_modules/knockout/build/output/knockout-latest.debug.js')
        .pipe(rename('knockout.js'))
        .pipe(gulp.dest('dist/js/vendor/'));
});
