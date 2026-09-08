import { readFile } from 'node:fs/promises';

import { expect, test } from './fixtures/app';

/**
 * Risk #1, delivery half — `context/foundation/test-plan.md` §2 and §3 Phase 5.
 *
 * The Cambridge report's floor is a single validated control
 * (`cambridge-report.component.ts:444` is its only `Validators.required`), which
 * makes this the shortest complete flow in the product — and that brevity is
 * exactly why the gate is worth driving here: almost nothing separates an empty
 * form from a downloadable one.
 *
 * What no cheaper layer reaches is the same as everywhere else in this folder:
 * `render-pdf.ts:29-36` replaces `pdfMake.createPdf`, so its `download()` is an
 * inert stub and the unit specs stop at `.getBlob()`. The click, the real
 * `.download()` call and the browser's file delivery run nowhere else.
 *
 * §7's ceiling applies: this asserts delivery only. The input-space claims for
 * this report — required-only floor, blank exam terms, long text, non-ASCII
 * names — belong to `fixtures/edge/cambridge-report.edge.fixture.ts`, and the
 * gate's *disabled* direction is already owned by
 * `cambridge-report.component.spec.ts:135-142`.
 */
test('Risk #1 delivery: the Cambridge report download click ends in a PDF file', async ({
  signedIn: page,
  uncaughtErrors,
}) => {
  // Stamped per run, so the asserted filename is also the evidence that this
  // file came from this run's data rather than from a leftover.
  const studentName = `E2E Delivery ${Date.now().toString(36)}`;

  await page.getByRole('button', { name: 'Raport Cambridge' }).click();

  await page.getByRole('textbox', { name: 'Imię i nazwisko ucznia' }).fill(studentName);

  const downloadButton = page.getByRole('button', { name: 'Generuj PDF' });

  // Bound to `form.invalid` (`cambridge-report.component.html:285`), so this
  // waits on the app's own completeness signal rather than on a duration. The
  // enabled direction is the half no cheaper layer covers.
  await expect(downloadButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await downloadButton.click();
  const download = await downloadPromise;

  // `cambridge-report.component.ts:424-425` names the file after the student.
  expect(download.suggestedFilename()).toBe(`${studentName.split(' ').join('-')}_cambridge_report.pdf`);

  // A real document was produced — not that bytes match a copy of the output.
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 4).toString('latin1')).toBe('%PDF');
  expect(bytes.byteLength).toBeGreaterThan(1024);

  // The silent failure mode the risk is named after.
  expect(uncaughtErrors, 'the Cambridge report flow threw in the browser').toEqual([]);
});
