// Karma configuration for the PDF-fidelity capture run only (`npm run test:capture`).
// The default `npm test` does not use this file — see angular.json → architect.test.
//
// Once `karmaConfig` is set, @angular/build:karma stops supplying its built-in configuration, so the
// frameworks/plugins/reporters block below reproduces the CLI defaults. Only `customLaunchers` and
// the seeded Chrome profile are this project's own.
//
// Two things a stock Chrome will not do, both of which the seeded profile fixes:
//   1. Only the FIRST download per page happens automatically; every later one waits on the
//      "automatic downloads" permission prompt and is dropped when Karma kills the browser. The
//      capture run produces eight PDFs from one page, so seven silently vanish without this.
//   2. Downloads land in the user's Downloads folder. Pinning the directory puts all eight
//      artifacts in one known, gitignored path instead.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const captureDir = path.join(__dirname, 'docs', 'pdf-fidelity', 'captured');
const profileDir = path.join(os.tmpdir(), 'britannia-reports-pdf-capture-profile');

fs.mkdirSync(captureDir, { recursive: true });
fs.mkdirSync(path.join(profileDir, 'Default'), { recursive: true });
fs.writeFileSync(
  path.join(profileDir, 'Default', 'Preferences'),
  JSON.stringify({
    download: {
      default_directory: captureDir,
      directory_upgrade: true,
      prompt_for_download: false,
    },
    profile: {
      default_content_setting_values: {
        // 1 = allow. Without this, only the first of the eight PDFs is written.
        automatic_downloads: 1,
      },
    },
  }),
);

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: path.join(__dirname, 'coverage', 'britannia-reports'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    reporters: ['progress', 'kjhtml'],
    // Headed Chrome: headless discards file-saver downloads.
    browsers: ['ChromeCapture'],
    customLaunchers: {
      ChromeCapture: {
        base: 'Chrome',
        // karma-chrome-launcher's own knob for the profile directory. A `--user-data-dir` flag does
        // NOT work here — the launcher always emits its own copy of that switch first.
        chromeDataDir: profileDir,
      },
    },
    restartOnFileChange: true,
  });
};
