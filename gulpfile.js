const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const stylus = require('gulp-stylus');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const px2rpx = require('postcss-pxtorpx');
const cssnano = require('gulp-cssnano');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const clean = require('gulp-clean');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');

gulp.task('json', () => {
  gulp
    .src(['src/project.config.json', 'src/app.json', 'src/views/**/*.json', 'src/components/**/*.json'], {
      base: 'src',
    })
    .pipe(gulp.dest('dist'));
});

gulp.task('wxs', () => {
  gulp
    .src(['src/utils/*.wxs'], {
      base: 'src',
    })
    .pipe(gulp.dest('dist'));
});

gulp.task('style', () => {
  gulp
    .src(['src/app.styl', 'src/views/**/*.styl', 'src/components/**/*.styl'], {
      base: 'src',
    })
    .pipe(
      plumber({
        errorHandler: errorAlert,
      })
    )
    .pipe(stylus())
    .pipe(
      postcss([
        autoprefixer({
          browsers: ['Android >= 4.0', 'iOS >= 7.0'],
          cascade: true,
          remove: true,
        }),
        px2rpx({
          multiplier: 2,
          propList: ['*', '!font*'],
        }),
      ])
    )
    .pipe(
      cssnano({
        zindex: false,
        autoprefixer: false,
        discardComments: { removeAll: true },
      })
    )
    .pipe(
      rename(path => {
        path.extname = '.wxss';
      })
    )
    .pipe(gulp.dest('dist'));
});

gulp.task('script', () => {
  gulp
    .src(
      [
        'src/app.js',
        'src/views/**/*.js',
        'src/components/**/*.js',
        'src/utils/**/*.js',
      ],
      {
        base: 'src',
      }
    )
    .pipe(
      plumber({
        errorHandler: errorAlert,
      })
    )
    .pipe(
      babel({
        presets: ['@babel/env'],
      })
    )
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('html', () => {
  gulp
    .src(['src/views/**/*.html', 'src/components/**/*.html'], { base: 'src' })
    .pipe(
      plumber({
        errorHandler: errorAlert,
      })
    )
    .pipe(
      rename(path => {
        path.extname = '.wxml';
      })
    )
    .pipe(gulp.dest('dist'));
});

gulp.task('image', () => {
  gulp
    .src('src/images/*', { base: 'src' })
    .pipe(
      plumber({
        errorHandler: errorAlert,
      })
    )
    .pipe(
      imagemin()
    )
    .pipe(gulp.dest('dist'));
});

gulp.task('dev', ['json', 'wxs', 'style', 'script', 'html', 'image'], () => {
  gulp.watch('src/**', ['json', 'wxs', 'style', 'script', 'html', 'image']);
});

gulp.task('clean', () => {
  gulp
    .src('dist', {
      read: false,
    })
    .pipe(
      clean({
        force: true,
      })
    );
});

// 错误提示
function errorAlert(error) {
  notify.onError({
    title: 'Error running something',
    message: error.message,
  })(error);
}
