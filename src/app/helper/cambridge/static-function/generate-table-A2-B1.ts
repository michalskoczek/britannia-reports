import { FormGroup } from '@angular/forms';
import { GenerateTable } from './generate-table';

export class GenerateTableA2B1 extends GenerateTable {
  public static generateTableOfA2B1ExamsOneTerm(form: FormGroup): any {
    return {
      style: 'marksTable',
      table: {
        widths: [125, 75, 50, '*'],
        headerRows: 1,
        body: [
          this.initHeaderInTable(),
          this.isArrayListeningA2B1ExistOne(form.value.listeningA2B1Array),
          this.isArrayReadingA2B1ExistOne(form.value.readingA2B1Array),
          this.isArrayWritingA2B1ExistOne(form.value.writingA2B1Array),
          this.isArraySpeakingA2B1ExistOne(form.value.speakingA2B1Array),
        ],
      },
    };
  }

  private static isArrayListeningA2B1ExistOne(array: any): any {
    if (array.length > 0) {
      return [
        { text: 'Słuchanie', alignment: 'center' },
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
          noWrap: true,
        },
      ];
    } else
      return [
        { text: 'Słuchanie', alignment: 'center' },
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

  private static isArrayReadingA2B1ExistOne(array: any): any {
    if (array.length > 0) {
      return [
        { text: 'Czytanie', alignment: 'center' },
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
          noWrap: true,
        },
      ];
    } else
      return [
        { text: 'Czytanie', alignment: 'center' },
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

  private static isArrayWritingA2B1ExistOne(array: any): any {
    if (array.length > 0) {
      return [
        { text: 'Pisanie', alignment: 'center' },
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
          noWrap: true,
        },
      ];
    } else
      return [
        { text: 'Pisanie', alignment: 'center' },
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

  private static isArraySpeakingA2B1ExistOne(array: any): any {
    if (array.length > 0) {
      return [
        { text: 'Mówienie', alignment: 'center' },
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
          noWrap: true,
        },
      ];
    } else
      return [
        { text: 'Mówienie', alignment: 'center' },
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

  public static generateTableOfA2B1ExamsTwoTerms(form: FormGroup): any {
    return {
      style: 'marksTable',
      table: {
        widths: [125, 75, 50, '*'],
        headerRows: 1,
        body: [
          this.initHeaderInTable(),
          ...this.isArrayListeningA2B1ExistTwo(form.value.listeningA2B1Array),
          ...this.isArrayReadingA2B1ExistTwo(form.value.readingA2B1Array),
          ...this.isArrayWritingA2B1ExistTwo(form.value.writingA2B1Array),
          ...this.isArraySpeakingA2B1ExistTwo(form.value.speakingA2B1Array),
        ],
      },
    };
  }

  private static isArrayListeningA2B1ExistTwo(array: any): any {
    if (array.length > 1) {
      return [
        [
          { text: 'Słuchanie', alignment: 'center', rowSpan: 2 },
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          [
            { text: 'Słuchanie', alignment: 'center' },
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
              noWrap: true,
            },
          ],
        ],
      ];
    } else
      return [
        [
          { text: 'Słuchanie', alignment: 'center' },
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

  private static isArrayReadingA2B1ExistTwo(array: any): any {
    if (array.length > 1) {
      return [
        [
          { text: 'Czytanie', alignment: 'center', rowSpan: 2 },
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          { text: 'Czytanie', alignment: 'center' },
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
            noWrap: true,
          },
        ],
      ];
    } else
      return [
        [
          { text: 'Czytanie', alignment: 'center' },
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

  private static isArrayWritingA2B1ExistTwo(array: any): any {
    if (array.length > 1) {
      return [
        [
          { text: 'Pisanie', alignment: 'center', rowSpan: 2 },
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          { text: 'Pisanie', alignment: 'center' },
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
            noWrap: true,
          },
        ],
      ];
    } else
      return [
        [
          { text: 'Pisanie', alignment: 'center' },
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

  private static isArraySpeakingA2B1ExistTwo(array: any): any {
    if (array.length > 1) {
      return [
        [
          { text: 'Mówienie', alignment: 'center', rowSpan: 2 },
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          { text: 'Mówienie', alignment: 'center' },
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
            noWrap: true,
          },
        ],
      ];
    } else
      return [
        [
          { text: 'Mówienie', alignment: 'center' },
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

  public static generateTableOfA2B1ExamsThreeTerms(form: FormGroup): any {
    return {
      style: 'marksTable',
      table: {
        widths: [125, 75, 50, '*'],
        headerRows: 1,
        body: [
          this.initHeaderInTable(),
          ...this.isArrayListeningA2B1ExistThree(form.value.listeningA2B1Array),
          ...this.isArrayReadingA2B1ExistThree(form.value.readingA2B1Array),
          ...this.isArrayWritingA2B1ExistThree(form.value.writingA2B1Array),
          ...this.isArraySpeakingA2B1ExistThree(form.value.speakingA2B1Array),
        ],
      },
    };
  }

  private static isArrayListeningA2B1ExistThree(array: any): any {
    if (array.length > 2) {
      return [
        [
          { text: 'Słuchanie', alignment: 'center', rowSpan: 3 },
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
      ];
    } else if (array.length === 2) {
      return [
        [
          { text: 'Słuchanie', alignment: 'center', rowSpan: 2 },
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          { text: 'Słuchanie', alignment: 'center' },
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
            noWrap: true,
          },
        ],
      ];
    } else
      return [
        [
          { text: 'Słuchanie', alignment: 'center' },
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

  private static isArrayReadingA2B1ExistThree(array: any): any {
    if (array.length > 2) {
      return [
        [
          { text: 'Czytanie', alignment: 'center', rowSpan: 3 },
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
      ];
    } else if (array.length === 2) {
      return [
        [
          { text: 'Czytanie', alignment: 'center', rowSpan: 2 },
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          { text: 'Czytanie', alignment: 'center' },
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
            noWrap: true,
          },
        ],
      ];
    } else
      return [
        [
          { text: 'Czytanie', alignment: 'center' },
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

  private static isArrayWritingA2B1ExistThree(array: any): any {
    if (array.length > 2) {
      return [
        [
          { text: 'Pisanie', alignment: 'center', rowSpan: 3 },
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
      ];
    } else if (array.length === 2) {
      return [
        [
          { text: 'Pisanie', alignment: 'center', rowSpan: 2 },
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          { text: 'Pisanie', alignment: 'center' },
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
            noWrap: true,
          },
        ],
      ];
    } else
      return [
        [
          { text: 'Pisanie', alignment: 'center' },
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

  private static isArraySpeakingA2B1ExistThree(array: any): any {
    if (array.length > 2) {
      return [
        [
          { text: 'Mówienie', alignment: 'center', rowSpan: 3 },
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
      ];
    } else if (array.length === 2) {
      return [
        [
          { text: 'Mówienie', alignment: 'center', rowSpan: 2 },
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
            noWrap: true,
          },
        ],
        [
          {},
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
            noWrap: true,
          },
        ],
      ];
    } else if (array.length === 1) {
      return [
        [
          { text: 'Mówienie', alignment: 'center' },
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
            noWrap: true,
          },
        ],
      ];
    } else
      return [
        [
          { text: 'Mówienie', alignment: 'center' },
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
