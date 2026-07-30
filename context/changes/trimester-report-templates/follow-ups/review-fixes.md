# Follow-ups from implementation review

Queued during triage of `reviews/impl-review-phase-1.md` (2026-07-30).

## F1 — Re-examine the templates rule when App Check enforcement lands

- **Source**: Phase 1 review, finding F1 — `firestore.rules:63-67`
- **Decision taken**: Fix A — accept the gap now, revisit at App Check.
- **Owner**: whoever runs Phase 6.
- **Why this is written down**: the decision to accept rests entirely on App Check closing the hole.
  If Phase 6 ships without enforcement — as `S-01` shipped without it, which is how roadmap Open
  Roadmap Question #6 came to exist — the acceptance loses its basis and nobody would notice, because
  nothing fails.

**The gap.** The rule authorizes on `request.auth.uid == uid` alone, so any Google account that
completes Firebase sign-in can create, read and delete documents under its own
`users/{uid}/reportTemplates` subtree, whether or not it is on the `allowedUsers` list. There is no
cross-teacher leak and no student data is reachable — what is reachable is the project's storage and
its Spark write quota, by anyone holding the project id, which ships in the bundle.

**What Phase 6 must actually check**, beyond turning enforcement on:

- After enforcing, confirm a caller *without* a valid App Check token is rejected by Firestore — not
  merely that the app still works. The app working proves attestation succeeds, not that
  unattested callers fail.
- If enforcement is deferred again for any reason, the fallback is finding F1's Fix B: add
  `exists(/databases/$(database)/documents/allowedUsers/$(request.auth.token.email.lower()))` to the
  rule. Cost: one extra document read per template operation against the Spark 50K/day budget.

**Unresolved question carried with this:** whether App Check enforcement alone satisfies whatever
GDPR baseline the school director eventually sets (PRD Open Question #2). Not checked.

## Findings closed without action

Recorded so a later reader does not re-derive them as new.

| Finding | Decision | Consequence accepted |
| --- | --- | --- |
| F2 — `npm run emulators` fails on a fresh clone (missing `.emulator-data/`) | Skipped | The script is not self-bootstrapping. Phase 5's criterion 5.4 ("a newcomer can start the emulators using `src/CLAUDE.md` alone") is now only satisfiable through documentation — the `mkdir .emulator-data` step was added to `src/CLAUDE.md` when fixing F5. |
| F3 — Progress row 1.11 checked without evidence | Accepted as risk | 1.11 stays `[x]`. The import/export round-trip is standard and will work once the directory exists, but no one has observed it in this repo. |
| F4 — `EMULATOR_HOST = 'localhost'` vs the `127.0.0.1` the emulator binds | Skipped | Works on the one development machine. Would surface elsewhere as an apparent Firebase failure rather than a hostname one. |
| F6 — rules spec reads `firestore.rules` relative to cwd | Skipped | `npm run test:rules` is the only supported entry point and runs from the project root. |
