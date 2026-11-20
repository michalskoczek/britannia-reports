---
applyTo: "src/app/*-report/*-report.component.ts,src/app/shared/baner-base64.ts,src/app/shared/images-base64.ts,src/app/helper/cambridge/**,package.json"
---

# PDF fidelity — hard guardrail

The four report types (Cambridge, semester/trimester, Teddy Eddie, year-end) must produce
visually identical PDFs before and after any change. Source: `src/CLAUDE.md` §Hard rules,
`docs/pdf-fidelity-check.md`.

When reviewing a change to these files:

- A change to a `pdfmake` document definition, or to anything that feeds it (form values,
  helpers, embedded base64 assets, the `pdfmake` version), **must** show a completed
  `docs/pdf-fidelity-check.md` comparison for every report type the change can reach. A shared
  helper or asset reaches all four. Flag it as **blocking** if the PR does not mention it.
- `npm test` passing is **not** evidence of fidelity — it only proves a PDF renders.
- The single narrow exception: a guard that changes behaviour **only in states that throw today**
  (see `context/foundation/test-plan.md` §6.6). The PR must state the invariant in one sentence and
  show the guard is no wider than the crashing state.
- PDF text is Polish and stays in code — do not move it to translation files.
- Pre-existing `no-explicit-any` around `pdfmake` types is known; do not ask to fix it in passing.
