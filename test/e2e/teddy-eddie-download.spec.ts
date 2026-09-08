import { readFile } from 'node:fs/promises';

import { expect, test } from './fixtures/app';

/**
 * Risk #1, delivery half — `context/foundation/test-plan.md` §2 and §3 Phase 5.
 *
 * Teddy Eddie is the one report whose download is not a form submit: its
 * template has no `<form>` at all, and the control calls `downloadPDF()`
 * directly (`teddy-eddie-report.component.html:38`, component `:203-205`). Every
 * other spec in this folder rides `(ngSubmit)`, so none of them can vouch for
 * this path.
 *
 * What no cheaper layer reaches is the same as everywhere else in this folder:
 * `src/app/shared/testing/pdf-fidelity/render-pdf.ts:29-36` replaces
 * `pdfMake.createPdf`, so its `download()` is an inert stub and the unit specs
 * stop at `.getBlob()`. The click, the real `.download()` call and the browser's
 * file delivery run nowhere else.
 *
 * §7's ceiling applies: delivery only. Writes nothing to the roster, so it needs
 * neither the `student` fixture nor its cleanup.
 */
test('Risk #1 delivery: the Teddy Eddie report download click ends in a PDF file', async ({
  signedIn: page,
  uncaughtErrors,
}) => {
  // Stamped per run, so the asserted filename is also the evidence that this
  // file came from this run's data rather than from a leftover.
  const studentName = `E2E Delivery ${Date.now().toString(36)}`;

  // Clicked explicitly even though `tab-data.ts:33` makes this tab
  // `defaultActive: true`. Relying on the default would make this spec depend on
  // configuration it has no opinion about, and would let it break silently the
  // day the default moves to another report.
  await page.getByRole('button', { name: 'Raport Teddy Eddie' }).click();

  // Bound in the child component (`teddy-eddie-form.component.html:2-7`), which
  // is why the parent template carries no `formControlName` — and why a
  // role-based locator is the only kind that is indifferent to that split.
  const studentNameField = page.getByRole('textbox', { name: 'Imię i nazwisko ucznia' });
  await studentNameField.fill(studentName);

  // The readiness signal. Like the year-end report and unlike the gated pair,
  // this control has no `[disabled]` binding, so `toBeEnabled()` would pass on
  // an untouched form and prove nothing. The filled field's value is the state
  // that says the report is ready to name a file.
  await expect(studentNameField).toHaveValue(studentName);

  // `PDF`, not `Generuj PDF`. The button renders the literal string `PDF`
  // because `[translateKey]="'PDF'"` names a key that exists in neither
  // `src/assets/i18n/pl.json` nor `en.json` (both have only `downloadPDF`), and
  // ngx-translate echoes an unknown key; the projected
  // `{{ 'downloadPDF' | translate }}` is dropped for want of an `<ng-content>`
  // in `ButtonComponent`. That is a real defect, tracked in
  // `context/changes/teddy-eddie-pdf-button-label/` — and fixing it changes this
  // accessible name, so that change owns updating this locator. A carried-over
  // `{ name: 'Generuj PDF' }` finds nothing here.
  // `exact`, and it is load-bearing. `getByRole`'s `name` is a substring match
  // by default, and `PDF` is a substring of `Generuj PDF` — so the loose form
  // keeps finding this button after the defect is *fixed*, and would quietly
  // stop testifying to anything. Confirmed empirically: pointing
  // `[translateKey]` at `downloadPDF` leaves the loose locator green and turns
  // this one red, which is the whole reason the spec is allowed to hard-code a
  // name it also calls a bug. (The `mat-icon` ligature is `aria-hidden`, so the
  // accessible name is `PDF` and nothing else.)
  const downloadButton = page.getByRole('button', { name: 'PDF', exact: true });

  const downloadPromise = page.waitForEvent('download');
  await downloadButton.click();
  const download = await downloadPromise;

  // `teddy-eddie-report.component.ts:333-334` builds the same name shape as the
  // year-end report — spaces retained, diacritic carried. The value below is the
  // one the browser actually delivered, not the builder's string assumed.
  expect(download.suggestedFilename()).toBe(`Raport końcowy 2025-26 - ${studentName}.pdf`);

  // A real document was produced — not that bytes match a copy of the output.
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 4).toString('latin1')).toBe('%PDF');
  expect(bytes.byteLength).toBeGreaterThan(1024);

  // The silent failure mode the risk is named after.
  expect(uncaughtErrors, 'the Teddy Eddie report flow threw in the browser').toEqual([]);
});
