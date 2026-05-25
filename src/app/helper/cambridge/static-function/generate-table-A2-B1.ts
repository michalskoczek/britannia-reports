import { FormGroup } from '@angular/forms';
import { GenerateTable } from './generate-table';

export class GenerateTableA2B1 extends GenerateTable {
  private static buildAllRows(form: FormGroup, maxTerms: number): any[][] {
    const v = form.value;
    return [
      ...this.buildRows('Słuchanie', v.listeningA2B1Array, maxTerms),
      ...this.buildRows('Czytanie', v.readingA2B1Array, maxTerms),
      ...this.buildRows('Pisanie', v.writingA2B1Array, maxTerms),
      ...this.buildRows('Mówienie', v.speakingA2B1Array, maxTerms),
    ];
  }

  public static generateTable(form: FormGroup, maxTerms: number): any {
    return this.buildTable(this.buildAllRows(form, maxTerms));
  }
}
