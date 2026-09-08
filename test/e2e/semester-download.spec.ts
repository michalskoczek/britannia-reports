import { readFile } from 'node:fs/promises';

import { Page } from '@playwright/test';

import { expect, test } from './fixtures/app';

/**
 * Risk #1, delivery half — `context/foundation/test-plan.md` §2 and §3 Phase 5.
 *
 * *A teacher fills a complete report, clicks download, and no PDF appears; the
 * error reaches the browser console only.*
 *
 * §3 Phase 1 closed the builder half at the unit layer, but it cannot reach this
 * one: `src/app/shared/testing/pdf-fidelity/render-pdf.ts:29-36` replaces
 * `pdfMake.createPdf` outright, so its `download()` is an inert stub and every
 * component spec stops at `.getBlob()`. Nothing anywhere executes the click, the
 * real `.download()` call, or the browser's file delivery. That is what this
 * asserts, and — per §7's ceiling — all it asserts: no input-space claim, no
 * field ownership, no PDF content.
 *
 * Shape is modelled on `test/e2e/seed.spec.ts`, the suite's exemplar (excluded
 * from runs by `testIgnore`). Unlike the seed, this spec deliberately does *not*
 * go through the student picker: it writes nothing to the roster, so it needs
 * neither the `student` fixture nor its cleanup. The picker's quick-add is
 * Risk #2 territory, owned by §3 Phase 2 at the component-integration level.
 */

/**
 * Opens a `mat-select` by its label and picks the option with this name.
 *
 * For controls where the chosen value carries meaning — it says out loud which
 * option the flow depends on, and fails if that option stops being offered.
 */
async function selectOption(page: Page, label: string, optionName: string): Promise<void> {
  const combobox = page.getByRole('combobox', { name: label });
  await combobox.click();

  const listbox = page.getByRole('listbox');
  await listbox.getByRole('option', { name: optionName, exact: true }).click();

  // The next select cannot be clicked through the open overlay. Waiting for the
  // listbox to disappear is the state that says "this choice is committed";
  // waiting on a duration would only say "some time passed".
  await expect(listbox).toHaveCount(0);
  await expect(combobox).toContainText(optionName);
}

/**
 * Opens a `mat-select` by its label, takes whichever option is offered first,
 * and asserts the control ended up holding it.
 *
 * Only for controls whose value this test has no opinion about — here the six
 * descriptive marks, because the claim is that a complete report yields a file,
 * not that it carries a particular grade. The read-back keeps the positional
 * pick honest: a blind `.first()` click would let a reordered or emptied option
 * list quietly change what was filled while still passing.
 */
async function selectFirstOfferedOption(page: Page, label: string): Promise<void> {
  const combobox = page.getByRole('combobox', { name: label });
  await combobox.click();

  const listbox = page.getByRole('listbox');
  const option = listbox.getByRole('option').first();
  const chosen = (await option.innerText()).trim();
  await option.click();

  await expect(listbox).toHaveCount(0);
  await expect(combobox).toContainText(chosen);
}

test('Risk #1 delivery: the semester report download click ends in a PDF file', async ({
  signedIn: page,
  uncaughtErrors,
}) => {
  // The name is stamped per run so the asserted filename is also the evidence
  // that this file came from this run's data rather than from a leftover.
  const studentName = `E2E Delivery ${Date.now().toString(36)}`;

  await page.getByRole('button', { name: 'Raport semestralny' }).click();

  await test.step('fill the report to its validator floor', async () => {
    await page.getByRole('textbox', { name: 'Imię i nazwisko ucznia' }).fill(studentName);

    // Named, not positional, and set before the marks: `markOptions()` builds
    // each mark's option list from the current `sex`
    // (`semestr-report.component.ts:305-321`), so changing it afterwards
    // rewrites all six controls.
    // `Uczeń/Uczennica` — no spaces around the slash. `pl.json:19` (`maleFemale`)
    // is the report form's own label; the seed's spaced variant belongs to the
    // picker quick-add, which this spec does not open.
    await selectOption(page, 'Uczeń/Uczennica', 'Uczennica');

    for (const mark of [
      'Wymowa',
      'Słownictwo',
      'Przygotowanie do zajęć',
      'Prace domowe',
      'Zaangażowanie',
      'Zachowanie',
    ]) {
      await selectFirstOfferedOption(page, mark);
    }
  });

  const downloadButton = page.getByRole('button', { name: 'Generuj PDF' });

  // The control is bound to `form.invalid`, so this waits for the app's own
  // answer to "is this report complete" rather than for a guess about how long
  // filling it takes. It is also the only direction of the gate no cheaper
  // layer covers — the disabled direction is already asserted by
  // `semestr-report.component.spec.ts:160-170`.
  await expect(downloadButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await downloadButton.click();
  const download = await downloadPromise;

  // `semestr-report.component.ts:944-945` names the file after the student, so
  // the stamped name proves this document is about this run's data.
  expect(download.suggestedFilename()).toBe(`${studentName.split(' ').join('-')}_semester_report.pdf`);

  // A real document was produced — not that bytes match a copy of the output,
  // which is the tautology §2 warns about for this risk.
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 4).toString('latin1')).toBe('%PDF');
  expect(bytes.byteLength).toBeGreaterThan(1024);

  // The silent failure mode the risk is named after: the teacher gets no signal
  // because the error only ever reached the console.
  expect(uncaughtErrors, 'the semester report flow threw in the browser').toEqual([]);
});
