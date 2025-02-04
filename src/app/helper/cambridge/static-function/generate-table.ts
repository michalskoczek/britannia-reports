export abstract class GenerateTable {
  static initHeaderInTable(): any {
    return [
      {
        text: 'Umiejętność',
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: `Test nr`,
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: 'Data',
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: 'Uzyskany wynik',
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
