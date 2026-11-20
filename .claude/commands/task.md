---
description: Take a GitHub issue end-to-end — branch from develop, run the 10x flow, open a PR that closes the issue
argument-hint: <issue number>
---

Work on GitHub issue #$ARGUMENTS of this repository.

1. **Read the issue.** `gh issue view $ARGUMENTS --comments`. If it does not exist, is closed, or
   has no acceptance criteria, stop and say so instead of guessing scope.
2. **Branch from `develop`.** `git fetch origin`, then `git switch -c <type>/<issue>-<slug> origin/develop`,
   where `<type>` is `feat`, `fix`, `chore` or `docs` and `<slug>` is 2–4 kebab-case words from the
   title. Never work on `develop` or `master` directly — the ruleset rejects direct pushes.
3. **Open the change.** Run `/10x-new <slug>` with the issue's goal as intent, and put the issue
   URL and its acceptance criteria into the change's Notes.
4. **Plan, then implement.** Run `/10x-plan <slug>`; show me the plan and wait for my approval
   before `/10x-implement <slug>`. If the issue ticks the PDF or `firestore.rules` guardrail,
   the plan must include that check.
5. **Verify locally** with the same gates CI runs: `npm run lint`, `npx tsc --noEmit`,
   `npm run build`, `npm test -- --watch=false --browsers=ChromeHeadless`, plus `npm run test:rules`
   when rules changed. Report anything red as red.
6. **Open the PR into `develop`.** Conventional Commits title; body with a short summary, how it
   was verified, and `Closes #$ARGUMENTS`. Then stop: merging is mine.
