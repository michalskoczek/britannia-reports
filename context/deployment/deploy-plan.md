# Deploy Plan — Walking-skeleton deploy of britannia-reports to Firebase Hosting

## Context

`context/foundation/infrastructure.md` (researched 2026-05-25, frontmatter refreshed 2026-06-02) picks **Firebase (Hosting + Auth + Firestore)** as the deploy target for this Angular 20 SPA. The health check from earlier today (`context/foundation/health-check.md`) confirms the project is operationally ready: 5/5 tests pass, `ng lint` is clean, `ng build --configuration production` succeeds, `firebase-tools` v15.19.0 is installed, and `firebase.json` + `.firebaserc` are on disk.

The goal of this deploy is a **walking-skeleton first deploy**: get the current SPA (the four existing report types — Cambridge, semester/trimester, Teddy Eddie, year-end) live on Firebase Hosting via a preview channel, verify the four PDF report flows still produce visually identical PDFs (per the project's hard guardrail in `src/CLAUDE.md`), then promote to the live channel.

**Out of scope** (deferred to the brownfield change that implements FR-001..FR-014):

- Firebase Authentication (Google OAuth) — no app code uses it yet.
- Firestore — no app code reads/writes persistent data yet. Database location decision (one-way per infrastructure.md risk register) is deferred until the FR-005..009 work begins.
- `@angular/fire` SDK integration — premature without Auth/Firestore.
- CI/CD pipeline — explicitly deferred to lesson M1L5 (`Sprint Zero z Agentem: infrastruktura, walking skeleton i pierwszy deploy`).
- Cloud Functions, custom domains, multi-region setup — all v2 concerns per the PRD.

**User decision recorded during planning:** they will create a **new** Firebase project (the example name was `britannia-reports-2`) rather than reuse the existing `britannia-reports` project. The plan therefore includes a project-creation step plus an aliased `.firebaserc` update that keeps the legacy project ID accessible.

## Prerequisites already verified (read-only checks during planning)

- `package.json` — `firebase-tools@^15.18.0` (actual installed: 15.19.0); `firebase deploy --only hosting` script not in `package.json` scripts, will run via `npx`.
- `angular.json:44` — `outputPath.base: "dist"`. **This invalidates the "Day-0 bug" warning in infrastructure.md `## Unknown Unknowns` and `## Getting Started` step 1.** Current build writes to `dist/browser/`; `firebase.json:3` correctly points `public` at `dist/browser`. No firebase.json edit required.
- `firebase.json` — single `hosting` block, SPA rewrite (`**` → `/index.html`) wired correctly.
- `.firebaserc` — `projects.default: "britannia-reports"` (will be updated to the new project ID).
- `dist/browser/` exists from the production build run earlier this session.
- `firebase login:list` — returns "No authorized accounts" on this machine; login is the first manual step.

## Steps

Each step marks who runs it: **(User)** = manual, browser/console or interactive CLI; **(Agent)** = the agent runs it once the plan is approved.

### Phase 1 — One-time account + project setup

1. **(User) Decide the new project ID.** Firebase project IDs are global and irreversible (per infrastructure.md `## Unknown Unknowns` and the risk register row "Firebase project ID is irreversible"). Pick a final ID — the example was `britannia-reports-2`, but a more specific name (e.g. `britannia-reports-mvp`, `britannia-reports-prod`) is worth considering before locking it in. The chosen ID gets baked into the auth domain (`<id>.firebaseapp.com`), storage bucket name, and any future OAuth callback URLs.

2. **(User) `firebase login`.** In a terminal in the repo root, run `npx firebase login` (or `firebase login` if installed globally). Opens a browser, signs in with Google. One-time per machine.

3. **(User) Create the Firebase project via the Firebase Console.** Go to https://console.firebase.google.com, click "Add project", enter the ID chosen in step 1. **Skip Google Analytics** (irrelevant for a static SPA at MVP scale; can be added later). Use the default project location closest to PL users (multi-region `eur3` is the eventual Firestore choice — but that decision happens when Firestore is initialized, not at project creation). Console creation is preferred over `firebase projects:create` because the CLI variant sometimes requires the Blaze billing plan for the quota check, and Spark-plan project creation is reliably free in the Console.

4. **(Agent) Verify the project is visible to the logged-in account.**

   ```bash
   npx firebase projects:list
   ```

   The new ID should appear in the listed projects. If it doesn't, the user is logged in to a different Google account from the one that created the project — they fix login and re-run.

### Phase 2 — Wire the project to the repo

5. **(Agent) Update `.firebaserc` to point at the new project and keep an alias for the legacy one.** Edit `.firebaserc`:

   ```json
   {
     "projects": {
       "default": "<new-project-id>",
       "legacy": "britannia-reports"
     }
   }
   ```

   The `legacy` alias lets you flip back with `firebase use legacy` if you ever need to access the old project (e.g. to clean up, archive, or compare). The `default` alias is what `firebase deploy` uses unless `--project <id>` is passed explicitly.

6. **(Agent) Confirm the active project.**

   ```bash
   npx firebase use
   ```

   Should print the new project ID. If wrong, `npx firebase use default`.

### Phase 3 — Build & pre-deploy verification

7. **(Agent) Reproducible install.**

   ```bash
   npm ci
   ```

   Locks the install to `package-lock.json`. Catches drift between developer machines.

8. **(Agent) Lint + tests + production build, in that order. Abort the deploy on any failure.**

   ```bash
   npm run lint
   npx ng test --watch=false --browsers=ChromeHeadless
   npx ng build --configuration production
   ```

   Each must exit 0. The health-check baseline confirmed all three were green at the start of this session.

9. **(Agent) Pre-deploy file-existence check** (mitigation for risk register row "no native pre-deploy validation that the bundle actually loaded — silent empty deploys possible if path is wrong"):

   ```bash
   ls dist/browser/index.html
   ```

   If missing, the build silently failed — abort.

### Phase 4 — Preview deploy + manual verification

10. **(Agent) Deploy to a preview channel with a 7-day expiry.**

    ```bash
    npx firebase hosting:channel:deploy preview --expires 7d
    ```

    Returns a temporary public URL (`https://<new-project-id>--preview-<hash>.web.app` or similar). The preview channel is the safe verification surface before promoting to `live`. Per infrastructure.md `## Operational Story`, preview channel URLs are public by default — fine here because there is no user data and no Auth on the app yet.

11. **(User) Visually verify the preview URL.** Open the URL in a browser. Click through each of the four report tabs (Cambridge, semester/trimester, Teddy Eddie, year-end). For each:

    - Confirm the form renders with no console errors.
    - Fill in a minimal valid form payload.
    - Generate a PDF.
    - Compare the PDF against one generated locally (`npm start` → same form inputs) — they must be visually identical. **This is the PDF-fidelity hard guardrail from `src/CLAUDE.md` line 7.**

    The locale should display as Polish (date format `DD.MM.YYYY`, Polish month names) per `app.config.ts`. The English UI toggle (if exposed in the header) should swap strings but leave dates Polish-formatted (intentional per `src/CLAUDE.md`).

12. **(User) Decision point.** If the preview verifies clean, proceed to step 13. If not, capture the issue (which report? what was different in the PDF? was there a console error?) and abort the deploy — the issue gets fixed in code first, then the plan re-runs from step 7.

### Phase 5 — Promote to live

13. **(Agent) Deploy to the live channel.**

    ```bash
    npx firebase deploy --only hosting
    ```

    Publishes the build to `https://<new-project-id>.web.app` and `https://<new-project-id>.firebaseapp.com`. Time-to-live is typically under a minute.

14. **(User) Visually verify the live URL** the same way as step 11 — four reports, four PDFs, visual diff against local.

### Phase 6 — Capture the deploy state

15. **(Agent) Append a short record to the bottom of this file (`context/deployment/deploy-plan.md`).** The record should include: chosen project ID, live URL, preview channel URL (if still valid), the date of first deploy, and the firebase-tools version used. This is a write-once artifact created on first deploy; subsequent deploys don't update it unless the project ID, hosting URL, or secrets wiring changes.

## Files to modify

- `.firebaserc` — single edit, adds `default` (new project) and `legacy` (existing `britannia-reports`) aliases.
- This file (`context/deployment/deploy-plan.md`) — appended with the deploy record in step 15.

No changes required to:

- `firebase.json` — current `public: "dist/browser"` matches the actual build output.
- `angular.json` — output path is already correct.
- `package.json` — `firebase-tools` is at the latest 15.x; no script change needed (`npx firebase` is fine for a one-time deploy; a `deploy` script can be added later when CI lands in M1L5).
- `src/CLAUDE.md` — the build-output note ("confirm the path after `ng build` if deploying") is accurate as-is.
- Any application code — the walking-skeleton deploy is pure static-bundle hosting.

## Verification

End-to-end success criteria:

1. `npx firebase projects:list` shows the new project ID.
2. `npx firebase use` prints the new project ID as default.
3. `npm ci && npm run lint && npx ng test --watch=false --browsers=ChromeHeadless && npx ng build --configuration production` exits 0 at every step.
4. `dist/browser/index.html` exists after step 8.
5. The preview channel URL returned by step 10 loads in a browser, all four report tabs render, all four PDFs generate and match a locally-generated PDF visually.
6. The live URL after step 13 serves the same content as the preview verified in step 11.
7. This file records the deploy facts at the bottom (step 15).

## Risks (relevant to this deploy only)

Lifted and scoped from infrastructure.md `## Risk Register`. The auth/Firestore/Functions risks are out of scope for this walking-skeleton deploy and not repeated here.

| Risk | Likelihood | Impact | Mitigation in this plan |
|---|---|---|---|
| Wrong Firebase project selected at deploy time (deploy lands in `britannia-reports` instead of the new project) | Low | High | Step 6 verifies `firebase use` shows the new default. The `legacy` alias makes the old project explicit and accessible but not active by default. |
| Silent empty deploy because build output path mismatch | Very low (was Day-0 risk in infrastructure.md; no longer applicable per `angular.json:44`) | High if it happens | Step 9 file-existence check on `dist/browser/index.html` before deploy. |
| PDF fidelity regression (the hard guardrail) | Low (no application code changed in this deploy) | High | Steps 11 and 14 do explicit visual PDF diffs against locally-generated outputs. If even one of the four reports differs, the deploy is rejected. |
| Firebase project ID locked into auth domain, storage bucket, OAuth callbacks | High likelihood of regret if rushed | High if regretted | Step 1 explicitly forces the user to think about the name before creation. |
| Preview channel URL is public — fine now (no user data), but becomes load-bearing once Auth lands | N/A this deploy | N/A this deploy | Documented at the bottom of this file so the FR-001..002 work knows to gate Auth before the next deploy. |

## What the agent does NOT do without explicit further approval

- Does not create the Firebase project via CLI (`firebase projects:create`). Console-driven creation is the user's call.
- Does not pick the project ID — that's irreversible and user-owned.
- Does not skip the preview-first phase. Direct promotion to `live` without preview verification breaks the safety net.
- Does not edit `firebase.json` (no edit needed) or any application code (out of scope).
- Does not initialize Firestore, enable Auth providers, or install `@angular/fire`. Those land with the brownfield FR-001..014 change.

---

## Deploy record

(To be filled in by step 15 on first successful live deploy.)

- **Project ID:** _<to be set>_
- **Live URL:** _<to be set>_
- **First deploy date:** _<to be set>_
- **firebase-tools version at deploy:** _<to be set>_
- **Legacy project alias:** `britannia-reports`
