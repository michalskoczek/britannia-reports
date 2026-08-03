/**
 * The same descriptive-mark sentence, in the other gender's wording.
 *
 * The six descriptive-mark selects on the trimester/semester form build their
 * option lists from `mark.value` or `mark.valueFemale` depending on `sex`
 * (`SemestrReportComponent.markOptions`). A control still holding the variant
 * from the other side matches no option: the select renders blank, `required`
 * passes anyway because the control does hold a value, and the wrong-gender
 * sentence goes into the PDF. This is the translation that keeps the two in
 * agreement.
 *
 * Pure TypeScript, no Angular — it lives under `helper/` for that reason.
 */

import { Marks } from '../../shared/marks';

/**
 * The counterpart of `value` in `list`, for the gender `isMale` describes.
 *
 * Matching on **both** `value` and `valueFemale` is what makes this its own
 * inverse: whichever variant the control currently holds, the entry is found and
 * the requested side of it is returned. Several entries (all of
 * `pronunciationMarks`) carry identical variants, where the call is a no-op by
 * construction.
 *
 * An unmatched value is returned unchanged rather than blanked — a sentence
 * stored against an older version of the list stays put instead of silently
 * disappearing from a half-written report.
 */
export const counterpartValue = (list: Marks[], value: string | null, isMale: boolean): string | null => {
  const entry: Marks | undefined = list.find((mark) => mark.value === value || mark.valueFemale === value);

  if (entry === undefined) {
    return value;
  }

  return isMale ? entry.value : (entry.valueFemale ?? entry.value);
};
