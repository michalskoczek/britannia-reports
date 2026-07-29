# Deploy Runbook — britannia-reports → Firebase Hosting

This is a **living runbook**, not a one-time plan. Follow it for every deploy of the static SPA to Firebase Hosting. It replaces the original "walking-skeleton first deploy" plan (2026-06), which described a project-creation flow that was **planned but never executed** — see [Historical note](#historical-note-what-changed-from-the-original-plan).

## Context

`context/foundation/infrastructure.md` picks **Firebase (Hosting + Auth + Firestore)** as the deploy target for this Angular 20 standalone SPA. Only **Hosting** is in use today.

This runbook covers publishing the current SPA — the four report types (Cambridge, semester/trimester, Teddy Eddie, year-end) — to Firebase Hosting via a preview channel, verifying the PDF flows against the project's hard fidelity guardrail (`src/CLAUDE.md`), then promoting to the live channel.

**Out of scope** (deferred to the brownfield change implementing FR-001..FR-014):

- Firebase Authentication (Google OAuth) — no app code uses it yet; provider not enabled in the Console.
- Firestore — no app code reads/writes persistent data. `firebase firestore:databases:list` returns `No databases found`. The one-way database-location decision is **recorded as `eur3`** in `infrastructure.md` but deliberately not executed.
- `@angular/fire` SDK integration — premature without Auth/Firestore.
- CI/CD pipeline.
- Cloud Functions, custom domains, multi-region setup — v2 concerns per the PRD.

## Standing facts (verified 2026-07-10)

- **Firebase project: `britannia-reports`.** It is the *only* project on the account. `.firebaserc` sets it as `default`; there are no other aliases and none are needed.
- **Live site: https://britannia-reports.web.app** — already in production. Deploys are **not** first deploys.
- **Deploy source branch is `dev`, not `master`.** `dev` is ~156 commits ahead. Deploying from `master` would ship a much older app (it predates the Angular 20 upgrade and has no `year-report` component).
- **Signed in** as `mwskoczek@gmail.com` (`firebase login:list`). `firebase login` is only needed on a fresh machine.
- **`firebase-tools` 15.19.0**, installed as a devDependency. Invoke via `npx firebase`; there is no `deploy` script in `package.json`.
- **Build output is `dist/browser`.** `angular.json` sets `outputPath.base: "dist"` and `@angular/build:application` appends `browser`. `firebase.json` points `hosting.public` at `dist/browser`. **These two are coupled — never change one without the other in the same commit.**
  Note: `infrastructure.md` once called this configuration a "day-0 bug" and instructed changing `public` to `dist/britannia-reports/browser`. That was wrong and has since been corrected in that document. Do not reintroduce it: `dist/britannia-reports/` does not exist, and `firebase deploy` publishes an empty directory **without erroring**.
- **`firebase.json`** — single `hosting` block, SPA rewrite (`**` → `/index.html`) wired correctly.
- **`.firebase/`** is a local deploy cache, gitignored. Not a source artifact.

## Steps

**(User)** = manual, browser or interactive. **(Agent)** = the agent runs it once approved.

### Phase 1 — Build & pre-deploy verification

1. **(Agent) Reproducible install.**

   ```bash
   npm ci
   ```

   Locks the install to `package-lock.json`. Catches drift between machines. Skip only if `node_modules` is known-fresh.

2. **(Agent) Lint, tests, production build — in that order. Abort on any failure.**

   ```bash
   npm run lint
   npx ng test --watch=false --browsers=ChromeHeadless
   npm run build
   ```

   Each must exit 0. All three are green on `dev` as of 2026-07-10 (lint was red until the `year-report.component.ts` cleanup landed; tests are 5/5; build succeeds with pre-existing CommonJS warnings from `moment` and `pdfmake`, which are expected and not failures).

3. **(Agent) Pre-deploy file-existence gate.**

   ```bash
   ls dist/browser/index.html
   ```

   Missing file ⇒ the build silently produced nothing ⇒ **abort**. `firebase deploy` exits 0 on an empty directory, so this check is the only thing standing between a broken build and a blank production site.

### Phase 2 — Preview deploy + manual verification

4. **(Agent) Deploy to a preview channel with a 7-day expiry.**

   ```bash
   npx firebase hosting:channel:deploy <channel-name> --expires 7d
   ```

   Returns a temporary public URL, `https://britannia-reports--<channel>-<hash>.web.app`. Confirm the CLI prints **`found N files in dist/browser`** with a non-zero `N` — that line is the cheapest proof the bundle is real.

   Preview URLs are public. That is acceptable today because the app holds no user data and has no Auth. **Once FR-001/FR-002 land, revisit this** — a preview channel would expose an unauthenticated surface.

5. **(Agent) Automated smoke test.**

   ```bash
   U=<preview-url>
   curl -sI "$U" | head -1                        # expect HTTP/2 200
   curl -s  "$U" | grep -o "<app-root></app-root>" # expect a match
   curl -sI "$U/assets/i18n/pl.json" | head -1     # expect 200 — i18n is HTTP-loaded
   curl -sI "$U/assets/i18n/en.json" | head -1     # expect 200
   curl -sI "$U/no-such-route" | head -1           # expect 200 — SPA rewrite
   ```

   The i18n checks matter: `ngx-translate` fetches `./assets/i18n/*.json` at runtime, so a broken `assets` entry in `angular.json` shows up only on a deployed build, never on `ng serve`.

6. **(User) Visually verify the preview URL.** Click through each of the four report tabs. For each:

   - Confirm the form renders with no console errors.
   - Fill in a minimal valid payload.
   - Generate a PDF.
   - Compare against a PDF generated locally (`npm start`, same inputs) — they must be visually identical. **This is the PDF-fidelity hard guardrail (`src/CLAUDE.md`).** No automated substitute exists; this step cannot be delegated to the agent.

   Locale should render Polish (`DD.MM.YYYY`, Polish month names) per `app.config.ts`. The EN toggle swaps strings but leaves dates Polish-formatted — intentional.

7. **(User) Decision point.** Clean ⇒ go to step 8. Otherwise capture the issue (which report, what differed in the PDF, any console error), abort, fix in code, re-run from step 1.

### Phase 3 — Promote to live

8. **(Agent) Deploy to the live channel.**

   ```bash
   npx firebase deploy --only hosting
   ```

   Publishes to `https://britannia-reports.web.app` and `https://britannia-reports.firebaseapp.com`. Under a minute.

9. **(Agent) Confirm the release landed.**

   ```bash
   curl -sI https://britannia-reports.web.app | head -1   # expect HTTP/2 200
   npx firebase hosting:channel:list                      # 'live' shows a fresh Last Release Time
   ```

10. **(User) Visually verify the live URL** the same way as step 6.

11. **(Agent) Update the [Deploy record](#deploy-record)** at the bottom of this file with the date, branch, commit, and `firebase-tools` version.

### Rollback

Firebase Console → Hosting → pick a prior release → **Rollback**. This stays a manual, human-clicked operation per the production-access boundary in the root `CLAUDE.md`: destructive and irreversible actions are human-only.

`infrastructure.md` cites `firebase hosting:versions:clone` as a CLI path. **Verify the verb against `npx firebase hosting --help` on v15 before relying on it** — do not assume the documented syntax is current.

Hosting rollback does **not** touch Firestore. Once persistence lands, a hosting rollback will leave migrated data in its new shape; schema reversals need their own scripts.

## Files modified by a deploy

**None.** A deploy is pure static-bundle publishing.

- `firebase.json` — no edit. `public: "dist/browser"` is correct.
- `angular.json` — no edit. Output path is correct.
- `.firebaserc` — no edit. `default: britannia-reports` is correct.
- `package.json` — no edit.
- Application code — untouched.

The only file this runbook writes is itself (step 11, the deploy record).

## Verification checklist

1. `npm ci && npm run lint && npx ng test --watch=false --browsers=ChromeHeadless && npm run build` exits 0 at every step.
2. `dist/browser/index.html` exists.
3. `hosting:channel:deploy` reports a non-zero file count from `dist/browser`.
4. Preview URL: HTTP 200, `<app-root>` present, both i18n files 200, SPA rewrite 200.
5. Preview URL, by hand: four tabs render, four PDFs generate and match locally-generated PDFs visually.
6. Live URL serves the same content as the verified preview.
7. The deploy record below is updated.

**Added by the `S-01` sign-in gate (2026-07-28)** — the four report tabs are now behind Google sign-in, so
the checks above only run once you are through it:

8. The deployed domain is listed under Firebase Console → Authentication → Settings → Authorized domains.
   It is not there by default for a new preview channel, and its absence fails as `auth/unauthorized-domain`.
9. Sign in with a seeded account, then **close the browser entirely, reopen it, and load the URL again** —
   you should still be signed in. Auth persistence is inherited from `getAuth()` rather than set explicitly
   (see `auth.gateway.ts`), and nothing automated covers it, so this is the only check that it holds.
10. Sign in with a Google account that is *not* in `allowedUsers`: expect the no-access message and no
    session left behind.
11. App Check is still monitoring-only. Enabling enforcement needs a deployed client, so this deploy is the
    first moment it can be turned on — see roadmap Open Roadmap Question #6.

## Risks

Scoped to a hosting deploy. Auth/Firestore/Functions risks live in `infrastructure.md` and are out of scope here.

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Silent empty deploy from a build-output path mismatch | Low (paths verified aligned 2026-07-10) | High | Step 3 file-existence gate; step 4's `found N files` line. Never edit `outputPath` and `hosting.public` apart. |
| PDF fidelity regression — the hard guardrail | Low on a no-code deploy; **real whenever a report component changed** | High | Steps 6 and 10: explicit visual PDF diff against local output, all four reports. One mismatch ⇒ reject the deploy. |
| Deploying the wrong branch (`master` instead of `dev`) | Medium — `master` is the repo's default branch, so tooling and habit both point at it | High | Confirm `git branch --show-current` prints `dev` before step 1. `master` lacks `year-report` entirely. |
| An agent "fixes" `firebase.json` to `dist/britannia-reports/browser` on the strength of a stale doc | Low (source corrected) | High | Called out in Standing facts above and in `src/CLAUDE.md`. The path is `dist/browser`. |
| Preview channel URL is public — harmless now, load-bearing once Auth lands | N/A today | Medium later | Noted in step 4. FR-001/FR-002 work must gate Auth before the next preview deploy. |

## What the agent does NOT do without explicit further approval

- Does not promote to `live`. Steps 8–10 run only after the user confirms the preview (step 7).
- Does not create Firebase projects, or edit `.firebaserc`.
- Does not edit `firebase.json`, `angular.json`, or application code.
- Does not initialize Firestore, enable Auth providers, or install `@angular/fire`.
- Does not roll back production. Rollback is a human Console operation.

---

## Historical note: what changed from the original plan

The 2026-06 version of this file planned to **create a new Firebase project** (working name `britannia-reports-2`), repoint `.firebaserc` at it, and keep `britannia-reports` as a `legacy` alias. Recorded as a user decision at the time.

**That never happened.** As of 2026-07-10 the account holds exactly one project, `.firebaserc` has no `legacy` alias, and production has been live on the original `britannia-reports` since 2026-06-19. The first deploy went to the *existing* project, contradicting phases 1–2 of the old plan.

Those phases have been deleted rather than preserved, because an agent executing them today would create a second project, repoint `.firebaserc`, and publish to a fresh empty domain — orphaning the live site. If a project migration is ever genuinely wanted, plan it fresh with the live site's existence as the starting condition.

Two smaller corrections from the same pass: the old plan asserted `firebase login:list` returns "No authorized accounts" (it does not — the account is authenticated), and claimed a `src/CLAUDE.md` note reading "confirm the path after `ng build` if deploying" was accurate as-is (that note has since been rewritten to state the `dist/browser` coupling outright).

The old plan did get one important thing right, and it was the only document in the repo that did: it flagged, at its line 22, that `infrastructure.md`'s "Day-0 bug" warning about `firebase.json` was invalid per `angular.json`. That finding is now upstreamed into `infrastructure.md` and `src/CLAUDE.md`.

---

## Deploy record

- **Project ID:** `britannia-reports` (global, irreversible; baked into `britannia-reports.firebaseapp.com`)
- **Live URL:** https://britannia-reports.web.app
- **Deploy source branch:** `dev`
- **First live deploy:** 2026-06-19 12:59:43 (per `firebase hosting:channel:list`; `firebase-tools` version at that time not recorded)
- **firebase-tools version (current):** 15.19.0
- **Firestore:** not provisioned. Location decision recorded as `eur3`, not executed.
- **Auth:** Google provider not enabled.
- **Web app:** `britannia-reports-web`, App ID `1:1039458477078:web:90de33b8569b522a060137`. Config via `npx firebase apps:sdkconfig WEB <app-id>` — not a secret; it ships in the SPA bundle.
- **Secrets wired:** none. Hosting a static bundle needs no runtime secrets.
