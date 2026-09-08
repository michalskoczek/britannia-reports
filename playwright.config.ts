import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end configuration.
 *
 * There is deliberately no `webServer` block. This suite needs two processes —
 * `npm run emulators` and `npm start` — and the emulator suite needs a JDK and
 * imports `.emulator-data/`, which holds the seeded allowlist that makes
 * sign-in possible at all. Starting that behind the test runner's back would
 * either export over a developer's local seed or fail with a stack trace
 * instead of an instruction, so `test/e2e/fixtures/app.ts` checks both ports up
 * front and says which command is missing.
 *
 * `fullyParallel` is off: the specs share one teacher account and therefore one
 * roster in the Firestore emulator.
 */
export default defineConfig({
  testDir: './test/e2e',
  outputDir: './test/e2e/.output',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env['CI']),
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
