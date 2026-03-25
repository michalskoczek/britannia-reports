import { FormGroup } from '@angular/forms';
import { GenerateTable } from './generate-table';

export class GenerateTableA1 extends GenerateTable {
  private static buildAllRows(form: FormGroup, maxTerms: number): any[][] {
    const v = form.value;
    return [
      ...this.buildRows('Słuchanie', v.listeningA1Array, maxTerms),
      ...this.buildRows(
        'Czytanie i Pisanie',
        v.writingAndReadingA1Array,
        maxTerms
      ),
      ...this.buildRows('Mówienie', v.speakingA1Array, maxTerms),
    ];
  }

  public static generateTable(form: FormGroup, maxTerms: number): any {
    return this.buildTable(this.buildAllRows(form, maxTerms));
  }
}
