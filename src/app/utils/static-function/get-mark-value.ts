import { Marks } from '../../shared/data/marks';

export class GetMarkValue {
  static getMarkValue(
    selectedValue: string,
    marks: Marks[]
  ): string | undefined {
    let markObj: Marks | undefined = marks.find(
      (mark: Marks): boolean => mark.value === selectedValue
    );

    return markObj?.viewValue[0];
  }
}
