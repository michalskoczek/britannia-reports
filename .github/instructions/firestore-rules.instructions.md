---
applyTo: "firestore.rules,test/rules/**,src/app/**/*.gateway.ts"
---

# Firestore rules — the access boundary

The store holds minors' personal data. The rules, not the client, are what keep one teacher out
of another's data. Source: `src/CLAUDE.md` §Conventions, `context/foundation/test-plan.md` Risk #3.

When reviewing a change to these files:

- Any change to `firestore.rules` needs matching scenarios in `test/rules/` — both an allowed and a
  denied case for every new or widened `allow`. Flag a rules change without new scenarios as
  **blocking**.
- Ownership keys on the `{uid}` path segment **and** `isAllowlisted()`; neither check subsumes the
  other. Removing either from a per-teacher collection is **blocking**.
- `allowedUsers` stays read-only to clients (`allow write: if false`); it is seeded by an admin.
- Every file in `test/rules/` needs its own `projectId`; two files sharing one wipe each other's
  fixtures in parallel runs.
- Deploy order is rules first, then hosting (`npm run test:rules` before
  `firebase deploy --only firestore:rules`). A PR that ships a client depending on a new rule
  must say so.
- Gateways (`*.gateway.ts`) are the only place that calls `@angular/fire/firestore`; avoid live
  listeners (`onSnapshot`/`docData`) where a one-shot read suffices — Spark quotas are tight.
