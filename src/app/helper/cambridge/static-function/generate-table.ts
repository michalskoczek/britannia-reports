export abstract class GenerateTable {
  static initHeaderInTable(): any {
    return [
      {
        text: 'Umiejętność',
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: 'Data',
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: 'Wynik',
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: 'Zdajemy?',
        style: 'tableHeader',
        alignment: 'center',
      },
    ];
  }
}
