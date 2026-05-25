export abstract class GenerateTable {
  protected static initHeaderInTable(): any {
    return [
      { text: 'Umiejętność', style: 'tableHeader', alignment: 'center' },
      { text: 'Data', style: 'tableHeader', alignment: 'center' },
      { text: 'Wynik', style: 'tableHeader', alignment: 'center' },
      { text: 'Zdajemy?', style: 'tableHeader', alignment: 'center' },
    ];
  }

  protected static formatDate(date: any): string {
    return date ? new Date(date).toLocaleDateString() : '-';
  }

  protected static formatScore(score: any): string {
    return score ? `${score}%` : '-';
  }

  protected static formatResult(result: any): string {
    return result ?? '-';
  }

  protected static buildDataCells(entry: any): object[] {
    return [
      { text: this.formatDate(entry?.date), alignment: 'center' },
      { text: this.formatScore(entry?.score), alignment: 'center' },
      {
        text: this.formatResult(entry?.result),
        alignment: 'center',
        noWrap: true,
      },
    ];
  }

  protected static emptyDataCells(): object[] {
    return [
      { text: '-', alignment: 'center' },
      { text: '-', alignment: 'center' },
      { text: '-', alignment: 'center' },
    ];
  }

  protected static buildRows(
    label: string,
    array: any[],
    maxTerms: number
  ): any[][] {
    const count = Math.min(array.length, maxTerms);

    if (count === 0) {
      return [[{ text: label, alignment: 'center' }, ...this.emptyDataCells()]];
    }

    return array.slice(0, count).map((entry, index) => {
      const labelCell =
        index === 0
          ? {
              text: label,
              alignment: 'center',
              ...(count > 1 && { rowSpan: count }),
            }
          : {};

      return [labelCell, ...this.buildDataCells(entry)];
    });
  }

  protected static buildTable(rows: any[][]): object {
    return {
      style: 'marksTable',
      table: {
        widths: [125, 75, 50, '*'],
        headerRows: 1,
        body: [this.initHeaderInTable(), ...rows],
      },
    };
  }
}
