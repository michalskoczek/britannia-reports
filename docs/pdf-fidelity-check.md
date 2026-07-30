# PDF fidelity check

`src/CLAUDE.md` makes PDF fidelity a hard guardrail: the four report types must produce visually
identical PDFs before and after a change. This document is how you prove it.

The check is a **visual** comparison of PDFs generated from recorded form inputs. `npm test` smoke-covers
that every report type still renders — it asserts nothing about layout, so a green suite is not evidence
of fidelity.

## 1. When this procedure is mandatory

Run it for any change that touches:

- `src/app/*-report/*-report.component.ts` — the four `pdfmake` document builders
- `src/app/shared/baner-base64.ts`, `src/app/shared/images-base64.ts` — the embedded assets
- `src/app/helper/cambridge/` — the Cambridge table generator
- the `pdfmake` dependency version in `package.json`

Compare **every** report type whose builder or inputs the change can reach, not only the one you edited.
A shared helper or asset touches all four.

## 2. Recorded inputs

Eight fixtures live in `src/app/shared/testing/pdf-fidelity/fixtures/`, two per report type. Each records
one state a teacher can actually reach through the UI — array rows are built by calling the component's
own methods, never hand-constructed.

| Fixture id | What it records |
| --- | --- |
| `semestr-minimal` | Trimester report, required fields only — no date, no additional comment, no exam recommendation |
| `semestr-maximal` | Semester report with every conditional section on — additional comment and exam recommendation |
| `year-minimal` | Year-end report with an empty development path and no additional comment |
| `year-maximal` | Year-end report with a six-row development path, one deleted row, one hidden detail, and a comment |
| `cambridge-minimal` | Cambridge report with no exam type picked — empty results table, no comments |
| `cambridge-maximal` | Cambridge A2 Key report with two terms per skill, two comments, and an exam recommendation |
| `teddy-eddie-minimal` | Teddy Eddie report with no age picked — both tables render header rows only |
| `teddy-eddie-maximal` | Teddy Eddie report for a 5-year-old — three immersion rows, two Cambridge-path rows, one deleted |

If your change adds a conditional section that no fixture reaches, add a fixture in the same change —
otherwise the barrier does not cover the thing you built.

## 3. Environment preconditions

- **Headed Chrome.** `npm run test:capture` downloads real files through `file-saver`. Headless Chrome
  discards those downloads, so do **not** add `--browsers=ChromeHeadless` to the capture command.
- **A `pl-PL` system locale.** Dates are rendered with `toLocaleDateString`, and Chrome inherits the OS
  locale. Capturing on an `en-US` machine produces `6/12/2026` where the references say `12.06.2026`,
  and every comparison then reports a false difference. Check with `Get-Culture` (PowerShell) or
  `locale` (POSIX).
- **Nothing else to configure.** `karma-capture.conf.js` seeds a dedicated Chrome profile that allows
  multiple automatic downloads and pins the download directory; without it Chrome writes only the first
  of the eight files.

## 4. Produce the "before" artifacts

### Trimester/semester — already committed

`docs/pdf-fidelity/reference/semestr-minimal.pdf` and `semestr-maximal.pdf` are checked in. They were
captured from unmodified code and are the "before" side for that report type. Do not regenerate them as
part of a routine check; replacing a reference is a deliberate act (see §8).

### If you already captured before you started editing

`npm run test:capture` does **not** overwrite `docs/pdf-fidelity/captured/` — see the warning in §5,
which is worse. Either way, if that directory already holds PDFs produced before your change, copy it
somewhere outside the repository *before* you capture again:

```bash
cp -r docs/pdf-fidelity/captured ../br-before-pdfs
```

That is a complete "before" set for all four report types, and it costs nothing compared to the worktree
rebuild below. Losing it to an overwrite is the easiest mistake to make in this procedure.

### The other three report types — rebuild from history

Only the trimester/semester references are committed, so for `year`, `cambridge`, and `teddy-eddie` you
reconstruct the "before" artifacts from the pre-change commit:

```bash
git worktree add ../br-before <commit-before-your-change>
cd ../br-before
npm ci
npm run test:capture
```

The PDFs land in `../br-before/docs/pdf-fidelity/captured/`. Copy the ones you need somewhere stable,
then remove the worktree when you are done:

```bash
cd -
git worktree remove ../br-before
```

`npm ci` against an old commit only resolves while its lockfile still installs. If it does not, capture
the "before" artifacts *before* you start editing instead.

## 5. Produce the "after" artifacts

From your working tree, with your change applied:

```bash
npm run test:capture
```

Eight PDFs are written to `docs/pdf-fidelity/captured/` (gitignored), named after the fixture ids. The
run takes a few seconds and ends with a short pause while Chrome finishes writing the files.

**⚠ Empty `docs/pdf-fidelity/captured/` first, or you will compare stale files and see no differences.**
The capture goes through Chrome's download path, which does not overwrite: if `semestr-maximal.pdf`
already exists, the new run lands as `semestr-maximal (1).pdf` and leaves the old file exactly where the
comparison expects to find it. Nothing fails, nothing warns, and the check passes against the previous
capture. This bit `S-02` (2026-07-30) and was caught only on the file timestamps. So:

```bash
rm -rf docs/pdf-fidelity/captured
npm run test:capture
ls -l docs/pdf-fidelity/captured   # eight files, no "(1)" in any name, all timestamped just now
```

Check the listing every time. A ` (1)` in any filename means the directory was not clean and the run
must be redone.

If a fixture throws instead of rendering, that is a fidelity failure of the loudest kind — fix it before
comparing anything.

## 6. Compare

Open each "before" and "after" pair side by side at the same zoom, one page at a time, and check:

- [ ] **Page count** is unchanged
- [ ] **Table row and column counts** are unchanged in every table
- [ ] **Column widths** — no column has grown or collapsed
- [ ] **Margins and vertical spacing** between sections
- [ ] **Page breaks** fall between the same elements
- [ ] **Image placement and size** — the banner and any marks/icons
- [ ] **Font sizes and weights**, including table headers
- [ ] **The date field** renders in the same format (`DD.MM.YYYY`)
- [ ] **Conditional sections** present in the maximal fixtures are still present, and still absent in the
      minimal ones

Any difference that a teacher would notice is a regression, whether or not it looks like an improvement.
An intentional visual change must be stated as such in the change's plan and approved there — it is not
something this procedure can bless on its own.

## 7. Whole-file byte and hash comparison do not work

`pdfkit` stamps a fresh `CreationDate` and a fresh file `/ID` into every document, so two PDFs generated
from identical inputs one second apart differ in bytes and in every hash. `diff`, `cmp`, `sha256sum`, and
`git diff` over the whole file are all useless here. **§6 is the authority.**

Those two stamps are, however, the *only* non-deterministic bytes, and they sit in two narrow regions:
five digits inside the `/CreationDate (D:...)` string, and the two hex strings in the trailer's
`/ID [<…> <…>]`, within the last ~100 bytes. So for a before/after pair captured on the **same machine
with the same dependencies**, `cmp -l` is a useful *supporting* signal:

```bash
cmp -l ../br-before-pdfs/semestr-maximal.pdf docs/pdf-fidelity/captured/semestr-maximal.pdf
```

- Identical file size, and every differing offset inside those two regions ⇒ all content streams are
  byte-identical and the visual check is a formality.
- Anything else ⇒ something rendered differently. Go find it with the §6 checklist.

This does not replace §6. It says nothing about a pair that came from different machines, a different
dependency set, or a worktree rebuild, and it never tells you *what* changed.

## 8. Record the outcome

Append a short note under `## Progress` in the change's `context/changes/<change-id>/plan.md`:

```markdown
### PDF fidelity check

- Date: 2026-07-24
- Report types compared: trimester/semester (both fixtures), Cambridge (both fixtures)
- Before: committed references / worktree at <sha>
- Verdict: no visible differences
```

A check that is not recorded did not happen, as far as the next reader is concerned.

If the change deliberately alters a reference — a new fixture, or an approved visual change to the
trimester/semester form — replace the file under `docs/pdf-fidelity/reference/` in that same change, and
say in the note why the old reference no longer applies.
