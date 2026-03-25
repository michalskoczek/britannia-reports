import { FormGroup } from '@angular/forms';
import { GenerateTable } from './generate-table';

export class GenerateTableB2C1 extends GenerateTable {
  private static buildAllRows(form: FormGroup, maxTerms: number): any[][] {
    const v = form.value;
    return [
      ...this.buildRows('Listening', v.listeningB2C1Array, maxTerms),
      ...this.buildRows('Reading', v.readingB2C1Array, maxTerms),
      ...this.buildRows('Use of English', v.useOfEnglishB2C1Array, maxTerms),
      ...this.buildRows('Writing', v.writingB2C1Array, maxTerms),
      ...this.buildRows('Speaking', v.speakingB2C1Array, maxTerms),
    ];
  }

  public static generateTable(form: FormGroup, maxTerms: number): any {
    return this.buildTable(this.buildAllRows(form, maxTerms));
  }
}
