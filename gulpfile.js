const gulp = require("gulp");
const clean = require("gulp-clean");
const sequence = require("run-sequence");
const babel = require("gulp-babel");
const shell = require("gulp-shell");

const DIST = "./dist";

gulp.task("build:appengine", (done) => {
  sequence(
    "build:appengine:clean",
    "build:appengine:copy",
    done,
  );
});

gulp.task("build:appengine:clean", () => gulp.src(`${DIST}/appengine`, { read: false })
  .pipe(clean()));

gulp.task("build:appengine:copy", () => gulp.src([
  "./src/appengine/**/*.js",
  "./src/appengine/.gcloudignore",
  "./src/appengine/cron.yaml",
  "./src/appengine/app.yaml",
  "./protected/appengine/dispatch.yaml",
  "./protected/config.js",
  "./protected/keys/serviceAccount.json",
  "./src/appengine/package.json",
  "./src/appengine/package-lock.json",
  "!./src/appengine/node_modules/**/*",
])
  .pipe(gulp.dest(`${DIST}/appengine`)));

gulp.task("build:functions", (done) => {
  sequence(
    "build:functions:clean",
    "build:functions:compile",
    done,
  );
});

gulp.task("build:functions:compile", () => gulp.src([
  "./src/functions/**/*.js",
  "!./src/functions/node_modules/**/*",
])
  .pipe(babel({
    presets: ["env"],
  }))
  .pipe(gulp.dest(`${DIST}/functions`)));

gulp.task("build:functions:clean", () => gulp.src(`${DIST}/functions`, { read: false })
  .pipe(clean()));

gulp.task("build:functions:copy", () => gulp.src([
  "./src/functions/package.json",
  "./protected/keys/**/*",
  "./protected/config.js",
])
  .pipe(gulp.dest(`${DIST}/functions`)));

gulp.task("functions:install", shell.task("npm install", {
  cwd: `${DIST}/functions`,
}));


gulp.task("functions:start", shell.task("firebase serve --only functions --debug", {
  cwd: DIST,
}));

gulp.task("build:copy", () => gulp.src([
  "./src/firebase.json",
  "./protected/.firebaserc",
])
  .pipe(gulp.dest(`${DIST}`)));

gulp.task("functions", (done) => {
  sequence(
    "build:functions:compile",
    "build:functions:copy",
    "build:copy",
    "functions:install",
    "functions:start",
    done,
  );
});

gulp.task("build", ["build:appengine", "build:functions"]);
