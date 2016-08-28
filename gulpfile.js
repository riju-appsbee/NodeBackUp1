'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    plumber = require('gulp-plumber'),
    server = require('tiny-lr')(),
    refresh = require('gulp-livereload'),
    mocha = require('gulp-mocha'),
    notify = require('gulp-notify'),
    nodemon = require('gulp-nodemon'),
    jshint = require('gulp-jshint'),
    lrPort = 1713;

var paths = {
    styles: ['./public/assets/**/*.css'],

    assets: ['./public/assets/'],
    scripts: [
        './public/app/app.js',
        './public/app/app.config.js',
        './public/app/controllers.js',
        './public/app/directives.js',
        './public/app/services.js',
        './public/app/**/*.js'
    ],
    html: [
        './public/app/**/*.html'
    ],

    server: {
        js: ['./server/**/*.js'],
        //  specs: ['./server/specs/*.js']
    }
};


gulp.task('serve', function() {
    nodemon({
        'script': 'server.js'
    });
});

gulp.task('lint', function() {
    return gulp.src(paths.scripts)
        .pipe(plumber())
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        // .pipe(notify({message: 'jshint done'}));
});

gulp.task('scripts', function() {
    return gulp.src(paths.scripts)
        .pipe(plumber())
        //.pipe(concat('main.js'))
        //.pipe(gulp.dest('./public/'))
        .pipe(refresh(server))
        // .pipe(notify({message: 'JS concated'}));
});

// gulp.task('test', function(){
//   return gulp.src(paths.server.specs)
//     .pipe(mocha({reporter: 'spec'}))
//     .pipe(notify({message: "Specs ran"}));
// });

gulp.task('html', function() {
    return gulp.task('html', function() {
        gulp.src(paths.html)
            .pipe(refresh(server))
            //    .pipe(notify({message: 'Views refreshed'}));
    });
});

gulp.task('build', ['scripts', 'lint']);

gulp.task('lr', function() {
    server.listen(lrPort, function(err) {
        if (err) {
            return console.error(err);
        }
    });
});

gulp.task('watch', function() {
    gulp.watch(paths.html, ['html']);
    gulp.watch(paths.scripts, ['lint', 'scripts']);
    // gulp.watch(paths.styles, ['stylus']);
});

gulp.task('default', ['build', 'lr', 'serve', 'watch']); //
