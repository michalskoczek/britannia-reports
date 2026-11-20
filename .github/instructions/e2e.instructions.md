---
applyTo: "test/e2e/**,playwright.config.ts"
---

# E2E tests (Playwright)

Source: root `CLAUDE.md`, `.claude/skills/10x-e2e/references/e2e-anti-patterns.md`.

When reviewing a change to these files:

- Locators: `getByRole` / `getByLabel` / `getByText` first; `getByTestId` only when accessibility
  attributes are ambiguous. CSS selectors, XPath or DOM-structure locators in a spec are a finding.
  (Driving the Auth emulator's own account chooser in `ci-session.mjs` is the one exception.)
- `page.waitForTimeout()` is never acceptable — wait for state (`toBeVisible()`, `waitForURL()`,
  `waitForResponse()`).
- Each test is independent: its own setup and cleanup, unique ids (timestamp suffix), and teardown
  through the store (`roster.deleteByName`), not through the UI.
- The suite runs sequentially against one shared teacher account (`fullyParallel: false`,
  `workers: 1`) and has no `webServer` block on purpose — do not "fix" either.
- Specs assert on outcomes (a file was downloaded, no uncaught page errors), not on PDF layout;
  layout is the PDF-fidelity check's job.
