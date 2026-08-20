/**
 * The two input classes Risk #1 names and no source describes.
 *
 * `context/foundation/test-plan.md` Risk #1 lists "long free text" and "non-ASCII names" among the
 * inputs a teacher can legitimately enter. Nothing in the PRD, the tech-stack notes or the report
 * templates sets an expectation for either one: no maximum length is stated or enforced anywhere
 * (the PRD names exactly one required field across all four forms, `prd.md:115`, and no `maxlength`
 * exists on any control), and no source says which glyphs the embedded Roboto VFS must render.
 *
 * So the assertion these values feed is **deliberately the weakest one the sources support**: a PDF
 * is produced. It is not evidence that the text fits the page, that it did not overflow off the
 * bottom, or that a single Polish diacritic rendered as anything other than a blank box. Writing a
 * stronger assertion here would mean inventing an oracle — pinning whatever the implementation
 * happens to do today, which is the mirror-test anti-pattern. If a real expectation is ever
 * documented (a length cap, a font-coverage requirement), that is when these get sharper
 * assertions, and not before.
 *
 * Both values live here rather than in each edge module so the four report types exercise the same
 * input, and so this reasoning is stated once instead of drifting between four copies.
 */

const LONG_TEXT_SENTENCE =
  'Uczeń pracował systematycznie przez cały rok, chętnie brał udział w zajęciach dodatkowych ' +
  'i wykazywał dużą samodzielność podczas powtórek materiału. ';

/**
 * ~1.6 kB in one control — an order of magnitude past the longest comment any fidelity fixture
 * records, and far past what fits the space the layout reserves for it. No control caps its length,
 * so a teacher pasting a term's worth of notes reaches this.
 */
export const LONG_FREE_TEXT = LONG_TEXT_SENTENCE.repeat(12).trim();

/**
 * Polish diacritics in a name field. `Jaś` is the PRD's own worked example of what goes in the
 * display-name control (`prd.md:114`), so a report for a child with an ASCII-only name is the
 * exception in this school, not the rule. The surname adds the four remaining shapes the base Latin
 * set does not carry — ogonek, kreska, kropka and stroke — so one fixture covers the class.
 */
export const NON_ASCII_STUDENT_NAME = 'Jaś Żółciński-Łęcki';

/** The same name shortened to the display-first-name control, where the form asks for one. */
export const NON_ASCII_DISPLAY_NAME = 'Jaś';
