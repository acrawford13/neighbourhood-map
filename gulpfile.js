var gulp = require('gulp');
var rename = require('gulp-rename');

gulp.task('build', function(){
    gulp.src('node_modules/knockout/build/output/knockout-latest.js')
        .pipe(rename('knockout.js'))
        .pipe(gulp.dest('dist/js/vendor/'));
});

gulp.task('build:dev', function(){
    gulp.src('node_modules/knockout/build/output/knockout-latest.debug.js')
        .pipe(rename('knockout.js'))
        .pipe(gulp.dest('dist/js/vendor/'));
});
