import { readFile } from 'node:fs/promises';

import { expect, test } from './fixtures/app';

/**
 * Risk #1, delivery half — `context/foundation/test-plan.md` §2 and §3 Phase 5.
 *
 * The year-end report has no validators and no `[disabled]` binding on its
 * download control (`year-report.component.html:305-309`), so its control is
 * live the moment the tab opens. That removes the gate the semester and
 * Cambridge specs wait on, and it is exactly why this spec's whole value sits in
 * the click-to-file path: there is no validity state to prove, only delivery.
 *
 * What no cheaper layer reaches is the same as everywhere else in this folder:
 * `src/app/shared/testing/pdf-fidelity/render-pdf.ts:29-36` replaces
 * `pdfMake.createPdf`, so its `download()` is an inert stub and the unit specs
 * stop at `.getBlob()`. The click, the real `.download()` call and the browser's
 * file delivery run nowhere else.
 *
 * §7's ceiling applies: delivery only. This spec deliberately does **not**
 * exercise the untouched-form state — that state's *generation* is owned by the
 * `year-untouched` fixture, and its filename interpolates a literal `null`
 * (Risk #2 territory) that this plan does not pin.
 *
 * Writes nothing to the roster, so it needs neither the `student` fixture nor
 * its cleanup.
 */
test('Risk #1 delivery: the year-end report download click ends in a PDF file', async ({
  signedIn: page,
  uncaughtErrors,
}) => {
  // Stamped per run, so the asserted filename is also the evidence that this
  // file came from this run's data rather than from a leftover. Nothing
  // requires the field — it is filled precisely so the file carries the stamp.
  const studentName = `E2E Delivery ${Date.now().toString(36)}`;

  await page.getByRole('button', { name: 'Raport całoroczny' }).click();

  const studentNameField = page.getByRole('textbox', { name: 'Imię i nazwisko ucznia' });
  await studentNameField.fill(studentName);

  // The readiness signal, and the one place this spec differs from the gated
  // pair: `toBeEnabled()` on the download control would pass before the form
  // was touched at all and would therefore prove nothing here. The filled
  // field's own value is the state that says the report is ready to name a file.
  await expect(studentNameField).toHaveValue(studentName);

  const downloadButton = page.getByRole('button', { name: 'Generuj PDF' });

  const downloadPromise = page.waitForEvent('download');
  await downloadButton.click();
  const download = await downloadPromise;

  // `year-report.component.ts:568-569` builds this name. Unlike the semester and
  // Cambridge shapes it retains its spaces and carries a diacritic, and the
  // value below is the one the browser actually delivered — confirmed against a
  // real `suggestedFilename()`, not assumed from the builder's string.
  expect(download.suggestedFilename()).toBe(`Raport końcowy 2025-26 - ${studentName}.pdf`);

  // A real document was produced — not that bytes match a copy of the output,
  // which is the tautology §2 warns about for this risk.
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 4).toString('latin1')).toBe('%PDF');
  expect(bytes.byteLength).toBeGreaterThan(1024);

  // The silent failure mode the risk is named after: the teacher gets no signal
  // because the error only ever reached the console.
  expect(uncaughtErrors, 'the year-end report flow threw in the browser').toEqual([]);
});
