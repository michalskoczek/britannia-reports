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
  /**
   * `seed.spec.ts` is the exemplar new specs are modelled on, not coverage of
   * anything — so it is excluded from every run rather than counted as a test.
   *
   * Excluded here rather than renamed on purpose. Keeping the `.spec.ts` name
   * keeps the file matched by `eslint.config.js` (`**\/*.ts`) and by
   * `npx tsc --noEmit` (`tsconfig.json` declares no `include`, so it compiles
   * the whole tree) — both run on this machine as `pre-commit` gates. An
   * exemplar nothing type-checks is an exemplar that rots into wrong advice,
   * which is the one failure mode a quality lever cannot afford.
   */
  testIgnore: '**/seed.spec.ts',
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
