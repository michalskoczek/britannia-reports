import { counterpartValue } from './sex-variant';
import { involvementMarks, Marks, pronunciationMarks, vocabularyMarks } from '../../shared/marks';

/**
 * The four cases that matter are the four the report can reach: a boy's sentence
 * asked for as a girl's, the reverse, a value from no list at all, and an entry
 * whose two variants are the same string.
 */
describe('counterpartValue', () => {
  const male = (list: Marks[], index: number): string => list[index].value;
  const female = (list: Marks[], index: number): string => list[index].valueFemale as string;

  it('rewrites a male sentence into the female variant', () => {
    expect(counterpartValue(involvementMarks, male(involvementMarks, 1), false)).toBe(female(involvementMarks, 1));
  });

  it('rewrites a female sentence into the male variant', () => {
    expect(counterpartValue(involvementMarks, female(involvementMarks, 1), true)).toBe(male(involvementMarks, 1));
  });

  it('is its own inverse, because it matches on both variants', () => {
    const start: string = male(vocabularyMarks, 0);
    const there: string | null = counterpartValue(vocabularyMarks, start, false);

    expect(there).not.toBe(start);
    expect(counterpartValue(vocabularyMarks, there, true)).toBe(start);
  });

  it('returns an unmatched value unchanged rather than blanking it', () => {
    // A sentence stored against an older version of the list. Losing it would
    // empty a required select in a half-written report.
    expect(counterpartValue(involvementMarks, 'X zdanie z poprzedniej wersji listy', false)).toBe(
      'X zdanie z poprzedniej wersji listy'
    );
  });

  it('leaves a null control alone', () => {
    expect(counterpartValue(involvementMarks, null, false)).toBeNull();
  });

  it('is a no-op on an entry whose variants are identical', () => {
    // Every `pronunciationMarks` entry is written this way: the sentence carries
    // no gendered word, so both sides hold the same string.
    const value: string = male(pronunciationMarks, 2);

    expect(counterpartValue(pronunciationMarks, value, false)).toBe(value);
    expect(counterpartValue(pronunciationMarks, value, true)).toBe(value);
  });

  it('falls back to the male variant when an entry declares no female one', () => {
    const list: Marks[] = [{ viewValue: 'only', value: 'X jedyny wariant' }];

    expect(counterpartValue(list, 'X jedyny wariant', false)).toBe('X jedyny wariant');
  });
});
