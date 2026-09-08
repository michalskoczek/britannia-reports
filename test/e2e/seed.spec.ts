import { readFile } from 'node:fs/promises';

import { Page } from '@playwright/test';

import { expect, test } from './fixtures/app';

/**
 * The seed end-to-end test: one flow, written the way every later spec in this
 * folder should be written.
 *
 * What it is here to demonstrate, beyond the flow itself:
 *
 * - **Role-based locators.** Everything is reached by `getByRole` with the name
 *   a teacher reads on screen. No CSS class, no `formControlName`, no test id —
 *   a selector that survives a refactor of the markup but breaks when the label
 *   a user navigates by changes is the point, not a side effect. Where an
 *   option is taken by position rather than by name, the choice is read back
 *   and asserted — see `selectFirstOfferedOption`.
 * - **Waiting on state, never on time.** There is no `waitForTimeout` in this
 *   file. Every wait is an assertion about a state the app reaches: the picker
 *   has written the name into the form, the mark list has closed, the download
 *   control has become enabled because the form turned valid. The one
 *   assertion that leaves the browser polls, for the same reason.
 * - **Unique identifiers in the test data.** The student's name carries a
 *   per-run stamp (see the `student` fixture), so the assertions can tell this
 *   run's data from a leftover, and two runs cannot collide in one roster.
 * - **Cleanup that does not depend on the app.** The `student` fixture deletes
 *   the created document over the Firestore emulator's REST API after the test,
 *   whether it passed or failed.
 *
 * Scope note: this file is the reference shape that
 * `context/foundation/test-plan.md` §3 Phase 5 builds on. It covers the delivery
 * half of Risk #1 — that the download a teacher clicks ends in a file, and that
 * the browser stays free of uncaught exceptions getting there — which is the
 * half no cheaper layer can see. §7 bounds what e2e may assert: logic already
 * covered at the unit, component or rules level does not get a browser
 * restatement here. This spec is still not wired into any gate in §5.
 */

/**
 * Opens a `mat-select` by its label and picks the option with this name.
 *
 * The default when the value matters: it says out loud which option the flow
 * depends on, and it fails if that option stops being offered.
 */
async function selectOption(page: Page, label: string, optionName: string): Promise<void> {
  const combobox = page.getByRole('combobox', { name: label });
  await combobox.click();

  const listbox = page.getByRole('listbox');
  await listbox.getByRole('option', { name: optionName, exact: true }).click();

  // The next select cannot be clicked through the open overlay. Waiting for the
  // listbox to go away is the state that says "this choice is committed" —
  // waiting on a duration would only say "some time passed".
  await expect(listbox).toHaveCount(0);
  await expect(combobox).toContainText(optionName);
}

/**
 * Opens a `mat-select` by its label and takes whichever option is offered
 * first, then asserts the control ended up holding it.
 *
 * **Only for controls where the test does not depend on the value chosen** —
 * here, the six descriptive marks, because the claim under test is that a PDF
 * is produced for a complete report, not that it carries a particular grade.
 * The option labels are full sentences that change with the student's sex, so
 * naming one would pin the test to prose it has no opinion about.
 *
 * The read-back is what keeps the positional pick honest: a plain `.first()`
 * click is blind, and a reordered or emptied option list would quietly change
 * what this test filled in while still passing. Prefer `selectOption` anywhere
 * the value carries meaning.
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

/**
 * Risk #1 in `context/foundation/test-plan.md` §2: *a teacher fills a complete
 * report, clicks download, and no PDF appears — the builder throws on input the
 * teacher could legitimately enter, and the error reaches the browser console
 * only.*
 *
 * The unit layer (§3 Phase 1) proves the builder produces a document for a
 * recorded form state. What it cannot see is the half of the risk that is about
 * delivery: whether the click a teacher actually performs ends in a file. So
 * this asserts on the download itself, and on the browser staying free of
 * uncaught exceptions — the silent failure mode the risk is named after.
 */
test('Risk #1: a teacher who fills the semester report for a roster student receives a PDF file', async ({
  signedIn: page,
  student,
  roster,
  uncaughtErrors,
}) => {
  await page.getByRole('button', { name: 'Raport semestralny' }).click();

  await test.step('add the student through the picker quick-add', async () => {
    await page.getByRole('button', { name: 'Nie ma go na liście? Dodaj ucznia' }).click();

    // `exact` on both: the quick-add sits inside the report's own form, whose two
    // corresponding labels are supersets of these ("Imię i nazwisko ucznia", and
    // the same name-in-text label carrying a "(np. Jaś)" hint). Substring matching
    // resolves to two elements and fails as a strict-mode violation — loudly,
    // which is the behaviour worth keeping.
    await page.getByRole('textbox', { name: 'Imię i nazwisko', exact: true }).fill(student.studentName);
    await page.getByRole('textbox', { name: 'Imię ucznia do wyświetlenia w tekście', exact: true }).fill(student.name);
    // Named, not positional: the six descriptive marks are re-mapped off this
    // control, and the test data is a girl — picking whatever sits first would
    // silently make the report about a boy called Zosia.
    await selectOption(page, 'Uczeń / Uczennica', 'Uczennica');
    await page.getByRole('button', { name: 'Dodaj i wybierz' }).click();
  });

  // The picker writing the identity into the report is the state that says both
  // the Firestore write and the apply landed — and it is asserted against the
  // unique name, so a student left over from an earlier run cannot satisfy it.
  await expect(page.getByRole('textbox', { name: 'Imię i nazwisko ucznia' })).toHaveValue(student.studentName);
  // `expect.poll`, not a bare `expect`: this is the one assertion that leaves
  // the browser for another process, so it gets the same auto-retry Playwright's
  // web-first assertions have. A single-shot read here is the one place in this
  // file that could fail for timing rather than for the risk.
  await expect.poll(() => roster.findByName(student.studentName)).toHaveLength(1);

  await test.step('fill the six required descriptive marks', async () => {
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

  // The control is bound to `form.invalid`, so this waits for the form to
  // become valid — the app's own answer to "is this report complete", rather
  // than the test's guess about how long filling it takes.
  await expect(downloadButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await downloadButton.click();
  const download = await downloadPromise;

  // The builder names the file after the student, so the unique name is also
  // the evidence that this report is about this run's data.
  expect(download.suggestedFilename()).toBe(`${student.studentName.split(' ').join('-')}_semester_report.pdf`);

  // Assert a real document was produced, not that bytes match a copy of the
  // output — the tautology `test-plan.md` §2 warns about for this risk.
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 4).toString('latin1')).toBe('%PDF');
  expect(bytes.byteLength).toBeGreaterThan(1024);

  expect(uncaughtErrors, 'the report flow threw in the browser').toEqual([]);
});
