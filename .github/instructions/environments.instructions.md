---
applyTo: "src/environments/**,src/app/app.config.ts"
---

# Environments and Firebase wiring

Source: `src/CLAUDE.md` §Environments.

When reviewing a change to these files:

- `environment.staging.ts` must point only at the `britannia-reports-staging` project, never at
  `britannia-reports` (production data belongs to real children) — **blocking**.
- `environment.prod.ts` must keep `useEmulators: false`. `true` there points the live app at a
  localhost that does not exist and no gate catches it — **blocking**.
- The Firebase config values and the reCAPTCHA site key are **public by design** (they ship in
  the bundle). Do not ask to move them to secrets or `.env`; rules protect the data.
- `environment.model.ts` stays a separate, never-replaced file; merging it into an environment
  file breaks the compile-time contract `fileReplacements` relies on.
- Every environment file types itself against `Environment`; a new field must be added to the
  model and to every environment file in the same change.
- `provideAppCheck` is skipped while `useEmulators` is true; an App Check problem shows up as
  `permission-denied` on Firestore calls, not as a sign-in failure.
