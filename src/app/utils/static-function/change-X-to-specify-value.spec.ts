import {
  changeXToEmptyValue,
  changeXToStudentName,
  changeXToYValue,
} from './change-X-to-specify-value';

describe('static function change X', (): void => {
  it('should change X to student name', (): void => {
    expect(
      changeXToStudentName('X wygląda na zmęczonego', 'Jan Nowak')
    ).toEqual('Jan Nowak wygląda na zmęczonego');
  });

  it('should change X to Y value', (): void => {
    expect(changeXToYValue('Kupa Józka', 'Dupa Józka')).toEqual(
      'Dupa Józkaupa Józka'
    );
  });

  it('should change X to empty value', (): void => {
    expect(changeXToEmptyValue('Hello world')).toEqual('ello world');
  });
});
