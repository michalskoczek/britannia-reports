import { FormGroup } from '@angular/forms';

export class GenerateTableA1 {
  public static generateTableOfA1ExamsOneTerm(form: FormGroup): any {
    return {
      style: 'marksTable',
      table: {
        widths: ['*', 'auto', '*', 'auto', '*'],
        headerRows: 1,
        body: [
          [
            {
              text: 'Umiejętność',
              style: 'tableHeader',
              alignment: 'center',
            },
            {
              text: `Nr testu`,
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
          ],

          this.isArrayListeningA1ExistOne(form.value.listeningA1Array),
          this.isArrayReadingWritingA1ExistOne(
            form.value.writingAndReadingA1Array
          ),
          this.isArraySpeakingA1ExistOne(form.value.speakingA1Array),
        ],
      },
    };
  }

  private static isArrayListeningA1ExistOne(array: any): any {
    if (array.length > 0) {
      return [
        { text: 'Słuchanie', alignment: 'center' },
        { text: '1', alignment: 'center' },
        {
          text: `${
            array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
          }`,
          alignment: 'center',
        },
        {
          text: `${array[0].score ? `${array[0].score}%` : '-'}`,
          alignment: 'center',
        },
        {
          text: `${array[0].result ? array[0].result : '-'}`,
          alignment: 'center',
        },
      ];
    } else
      return [
        { text: 'Słuchanie', alignment: 'center' },
        { text: '-', alignment: 'center' },
        {
          text: `-`,
          alignment: 'center',
        },
        {
          text: `-`,
          alignment: 'center',
        },
        {
          text: `-`,
          alignment: 'center',
        },
      ];
  }

  private static isArrayReadingWritingA1ExistOne(array: any): any {
    if (array.length > 0) {
      return [
        { text: 'Czytanie i Pisanie', alignment: 'center' },
        { text: `1`, alignment: 'center' },
        {
          text: `${
            array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
          }`,
          alignment: 'center',
        },
        {
          text: `${array[0].score ? `${array[0].score}%` : '-'}`,
          alignment: 'center',
        },
        {
          text: `${array[0].result ? array[0].result : '-'}`,
          alignment: 'center',
        },
      ];
    } else
      return [
        { text: 'Czytanie i Pisanie', alignment: 'center' },
        { text: `-`, alignment: 'center' },
        {
          text: `-`,
          alignment: 'center',
        },
        {
          text: `-`,
          alignment: 'center',
        },
        {
          text: `-`,
          alignment: 'center',
        },
      ];
  }

  private static isArraySpeakingA1ExistOne(array: any): any {
    if (array.length > 0) {
      return [
        { text: 'Mówienie', alignment: 'center' },
        { text: '1', alignment: 'center' },
        {
          text: `${
            array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
          }`,
          alignment: 'center',
        },
        {
          text: `${array[0].score ? `${array[0].score}%` : '-'}`,
          alignment: 'center',
        },
        {
          text: `${array[0].result ? array[0].result : '-'}`,
          alignment: 'center',
        },
      ];
    } else
      return [
        { text: 'Mówienie', alignment: 'center' },
        { text: '-', alignment: 'center' },
        {
          text: `-`,
          alignment: 'center',
        },
        {
          text: `-`,
          alignment: 'center',
        },
        {
          text: `-`,
          alignment: 'center',
        },
      ];
  }

  // TWO TERMS

  public static generateTableOfA1ExamsTwoTerm(form: FormGroup): any {
    return {
      style: 'marksTable',
      table: {
        widths: ['*', 'auto', '*', 'auto', '*'],
        headerRows: 1,
        body: [
          [
            {
              text: 'Umiejętność',
              style: 'tableHeader',
              alignment: 'center',
            },
            {
              text: `Nr testu`,
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
          ],
          ...this.isArrayListeningA1ExistTwo(form.value.listeningA1Array),
          ...this.isArrayReadingWritingA1ExistTwo(
            form.value.writingAndReadingA1Array
          ),
          ...this.isArraySpeakingA1ExistTwo(form.value.speakingA1Array),
        ],
      },
    };
  }

  private static isArrayListeningA1ExistTwo(array: any): any {
    if (array.length > 1) {
      return [
        [
          { text: 'Słuchanie', alignment: 'center', rowSpan: 2 },
          { text: '1', alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
        [
          {},
          { text: `2`, alignment: 'center' },
          {
            text: `${
              array[1].date ? new Date(array[1].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[1].score ? `${array[1].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[1].result ? array[1].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          [
            { text: 'Słuchanie', alignment: 'center' },
            { text: '1', alignment: 'center' },
            {
              text: `${
                array[0].date
                  ? new Date(array[0].date).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${array[0].score ? `${array[0].score}%` : '-'}`,
              alignment: 'center',
            },
            {
              text: `${array[0].result ? array[0].result : '-'}`,
              alignment: 'center',
            },
          ],
        ],
      ];
    } else
      return [
        [
          { text: 'Słuchanie', alignment: 'center' },
          { text: '-', alignment: 'center' },
          {
            text: `-`,
            alignment: 'center',
          },
          {
            text: `-`,
            alignment: 'center',
          },
          {
            text: `-`,
            alignment: 'center',
          },
        ],
      ];
  }

  private static isArrayReadingWritingA1ExistTwo(array: any): any {
    if (array.length > 1) {
      return [
        [
          { text: 'Czytanie i Pisanie', alignment: 'center', rowSpan: 2 },
          { text: `1`, alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
        [
          {},
          { text: `2`, alignment: 'center' },
          {
            text: `${
              array[1].date ? new Date(array[1].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[1].score ? `${array[1].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[1].result ? array[1].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          { text: 'Czytanie i Pisanie', alignment: 'center' },
          { text: `1`, alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else
      return [
        [
          { text: 'Czytanie i Pisanie', alignment: 'center' },
          { text: `-`, alignment: 'center' },
          {
            text: `-`,
            alignment: 'center',
          },
          {
            text: `-`,
            alignment: 'center',
          },
          {
            text: `-`,
            alignment: 'center',
          },
        ],
      ];
  }

  private static isArraySpeakingA1ExistTwo(array: any): any {
    if (array.length > 1) {
      return [
        [
          { text: 'Mówienie', alignment: 'center', rowSpan: 2 },
          { text: '1', alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
        [
          {},
          { text: '2', alignment: 'center' },
          {
            text: `${
              array[1].date ? new Date(array[1].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[1].score ? `${array[1].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[1].result ? array[1].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          { text: 'Mówienie', alignment: 'center' },
          { text: '1', alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else
      return [
        [
          { text: 'Mówienie', alignment: 'center' },
          { text: '-', alignment: 'center' },
          {
            text: `-`,
            alignment: 'center',
          },
          {
            text: `-`,
            alignment: 'center',
          },
          {
            text: `-`,
            alignment: 'center',
          },
        ],
      ];
  }

  // THREE TERMS

  public static generateTableOfA1ExamsThreeTerms(form: FormGroup): any {
    return {
      style: 'marksTable',
      table: {
        widths: ['*', 'auto', '*', 'auto', '*'],
        headerRows: 1,
        body: [
          [
            {
              text: 'Umiejętność',
              style: 'tableHeader',
              alignment: 'center',
            },
            {
              text: `Nr testu`,
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
          ],
          ...this.isArrayListeningA1ExistThree(form.value.listeningA1Array),
          ...this.isArrayReadingWritingA1ExistThree(
            form.value.writingAndReadingA1Array
          ),
          ...this.isArraySpeakingA1ExistThree(form.value.speakingA1Array),
        ],
      },
    };
  }

  private static isArrayListeningA1ExistThree(array: any): any {
    if (array.length > 2) {
      return [
        [
          { text: 'Słuchanie', alignment: 'center', rowSpan: 3 },
          { text: '1', alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
        [
          {},
          { text: '2', alignment: 'center' },
          {
            text: `${
              array[1].date ? new Date(array[1].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[1].score ? `${array[1].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[1].result ? array[1].result : '-'}`,
            alignment: 'center',
          },
        ],
        [
          {},
          { text: '3', alignment: 'center' },
          {
            text: `${
              array[2].date ? new Date(array[2].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[2].score ? `${array[2].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[2].result ? array[2].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else if (array.length === 2) {
      return [
        [
          { text: 'Słuchanie', alignment: 'center', rowSpan: 2 },
          { text: '1', alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
        [
          {},
          { text: '2', alignment: 'center' },
          {
            text: `${
              array[1].date ? new Date(array[1].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[1].score ? `${array[1].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[1].result ? array[1].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          { text: 'Słuchanie', alignment: 'center' },
          { text: '1', alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else
      return [
        [
          { text: 'Słuchanie', alignment: 'center' },
          { text: '-', alignment: 'center' },
          {
            text: `-`,
            alignment: 'center',
          },
          {
            text: `-`,
            alignment: 'center',
          },
          {
            text: `-`,
            alignment: 'center',
          },
        ],
      ];
  }

  private static isArrayReadingWritingA1ExistThree(array: any): any {
    if (array.length > 2) {
      return [
        [
          { text: 'Czytanie i Pisanie', alignment: 'center', rowSpan: 3 },
          { text: `1`, alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
        [
          {},
          { text: `2`, alignment: 'center' },
          {
            text: `${
              array[1].date ? new Date(array[1].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[1].score ? `${array[1].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[1].result ? array[1].result : '-'}`,
            alignment: 'center',
          },
        ],
        [
          {},
          { text: `3`, alignment: 'center' },
          {
            text: `${
              array[2].date ? new Date(array[2].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[2].score ? `${array[2].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[2].result ? array[2].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else if (array.length === 2) {
      return [
        [
          { text: 'Czytanie i Pisanie', alignment: 'center', rowSpan: 2 },
          { text: `1`, alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
        [
          {},
          { text: `2`, alignment: 'center' },
          {
            text: `${
              array[1].date ? new Date(array[1].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[1].score ? `${array[1].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[1].result ? array[1].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          { text: 'Czytanie i Pisanie', alignment: 'center' },
          { text: `1`, alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else
      return [
        [
          { text: 'Czytanie i Pisanie', alignment: 'center' },
          { text: `-`, alignment: 'center' },
          {
            text: `-`,
            alignment: 'center',
          },
          {
            text: `-`,
            alignment: 'center',
          },
          {
            text: `-`,
            alignment: 'center',
          },
        ],
      ];
  }

  private static isArraySpeakingA1ExistThree(array: any): any {
    if (array.length > 2) {
      return [
        [
          { text: 'Mówienie', alignment: 'center', rowSpan: 3 },
          { text: '1', alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
        [
          {},
          { text: '2', alignment: 'center' },
          {
            text: `${
              array[1].date ? new Date(array[1].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[1].score ? `${array[1].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[1].result ? array[1].result : '-'}`,
            alignment: 'center',
          },
        ],
        [
          {},
          { text: '3', alignment: 'center' },
          {
            text: `${
              array[2].date ? new Date(array[2].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[2].score ? `${array[2].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[2].result ? array[2].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else if (array.length === 2) {
      return [
        [
          { text: 'Mówienie', alignment: 'center', rowSpan: 2 },
          { text: '1', alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
        [
          {},
          { text: '2', alignment: 'center' },
          {
            text: `${
              array[1].date ? new Date(array[1].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[1].score ? `${array[1].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[1].result ? array[1].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          { text: 'Mówienie', alignment: 'center' },
          { text: '1', alignment: 'center' },
          {
            text: `${
              array[0].date ? new Date(array[0].date).toLocaleDateString() : '-'
            }`,
            alignment: 'center',
          },
          {
            text: `${array[0].score ? `${array[0].score}%` : '-'}`,
            alignment: 'center',
          },
          {
            text: `${array[0].result ? array[0].result : '-'}`,
            alignment: 'center',
          },
        ],
      ];
    } else
      return [
        [
          { text: 'Mówienie', alignment: 'center' },
          { text: '-', alignment: 'center' },
          {
            text: `-`,
            alignment: 'center',
          },
          {
            text: `-`,
            alignment: 'center',
          },
          {
            text: `-`,
            alignment: 'center',
          },
        ],
      ];
  }
}
