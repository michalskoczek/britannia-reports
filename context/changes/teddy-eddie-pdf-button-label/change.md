---
change_id: teddy-eddie-pdf-button-label
title: The Teddy Eddie download button renders "PDF" in every locale
status: new
created: 2026-09-08
updated: 2026-09-08
archived_at: null
---

## Notes

Found while writing `test/e2e/teddy-eddie-download.spec.ts`
(`context/changes/testing-click-ends-in-file/` Phase 2). Recorded, not fixed —
that plan changes no production code.

- **Symptom:** the Teddy Eddie report's download button reads **`PDF`** to both
  Polish and English users, where the other three reports read "Generuj PDF" /
  "Download PDF".
- **Cause, two independent halves:**
  1. `src/app/teddy-eddie-report/teddy-eddie-report.component.html:38` passes
     `[translateKey]="'PDF'"`. `PDF` is not a key in `src/assets/i18n/pl.json`
     or `en.json` — both carry only `downloadPDF` (line 104). ngx-translate
     echoes an unknown key, so the raw string `PDF` is what renders.
  2. The same element projects `{{ 'downloadPDF' | translate }}` as content,
     which would have rendered the right label — but
     `src/app/shared/components/button/button.component.html:1-15` has no
     `<ng-content>`, so the projection is silently dropped.

  Either half alone would be invisible; together they produce a wrong label with
  no error anywhere. Fixing only (1) is enough for this button; fixing (2) is a
  wider decision about whether `ButtonComponent` accepts projected content at
  all, and would affect every other caller.

- **Blast radius — read before implementing.** The button's *accessible name* is
  what changes. `test/e2e/teddy-eddie-download.spec.ts` locates the control with
  `page.getByRole('button', { name: 'PDF' })` and carries a comment pointing
  here. **Whichever change fixes this defect must update that locator in the same
  commit**, or the e2e suite goes red on a correct fix. Check
  `teddy-eddie-report.component.spec.ts` for the same coupling before landing.

- **Not urgent.** Cosmetic in effect, and the button works — `downloadPDF()` is
  wired to `(clicked)` and delivers a file (proven by the e2e spec above). This
  is a labelling defect, not a delivery one, so it sits outside Risk #1.
