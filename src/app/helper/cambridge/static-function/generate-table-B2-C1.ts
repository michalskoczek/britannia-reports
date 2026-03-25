import { FormGroup } from '@angular/forms';
import { GenerateTable } from './generate-table';

export class GenerateTableB2C1 extends GenerateTable {
  public static generateTableOfB2C1ExamsOneTerm(form: FormGroup): any {
    return {
      style: 'marksTable',
      table: {
        widths: [125, 75, 50, '*'],
        headerRows: 1,
        body: [
          this.initHeaderInTable(),
          this.isArrayListeningB2C1ExistOne(form.value.listeningB2C1Array),
          this.isArrayReadingB2C1ExistOne(form.value.readingB2C1Array),
          this.isArrayUseOfEnglishB2C1ExistOne(
            form.value.useOfEnglishB2C1Array
          ),
          this.isArrayWritingB2C1ExistOne(form.value.writingB2C1Array),
          this.isArraySpeakingB2C1ExistOne(form.value.speakingB2C1Array),
        ],
      },
    };
  }

  private static isArrayListeningB2C1ExistOne(array: any): any {
    if (array.length > 0) {
      return [
        { text: 'Listening', alignment: 'center' },
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
        { text: 'Listening', alignment: 'center' },
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

  private static isArrayReadingB2C1ExistOne(array: any): any {
    if (array.length > 0) {
      return [
        { text: 'Reading', alignment: 'center' },
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
        { text: 'Reading', alignment: 'center' },
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

  private static isArrayUseOfEnglishB2C1ExistOne(array: any): any {
    if (array.length > 0) {
      return [
        { text: 'Use of English', alignment: 'center' },
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
        { text: 'Use of English', alignment: 'center' },
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

  private static isArrayWritingB2C1ExistOne(array: any): any {
    if (array.length > 0) {
      return [
        { text: 'Writing', alignment: 'center' },
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
        { text: 'Writing', alignment: 'center' },
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

  private static isArraySpeakingB2C1ExistOne(array: any): any {
    if (array.length > 0) {
      return [
        { text: 'Speaking', alignment: 'center' },
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
        { text: 'Speaking', alignment: 'center' },
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

  public static generateTableOfB2C1ExamsTwoTerms(form: FormGroup): any {
    return {
      style: 'marksTable',
      table: {
        widths: [125, 75, 50, '*'],
        headerRows: 1,
        body: [
          this.initHeaderInTable(),
          ...this.isArrayListeningB2C1ExistTwo(form.value.listeningB2C1Array),
          ...this.isArrayReadingB2C1ExistTwo(form.value.readingB2C1Array),
          ...this.isArrayUseOfEnglishB2C1ExistTwo(
            form.value.useOfEnglishB2C1Array
          ),
          ...this.isArrayWritingB2C1ExistTwo(form.value.writingB2C1Array),
          ...this.isArraySpeakingB2C1ExistTwo(form.value.speakingB2C1Array),
        ],
      },
    };
  }

  private static isArrayListeningB2C1ExistTwo(array: any): any {
    if (array.length > 1) {
      return [
        [
          { text: 'Listening', alignment: 'center', rowSpan: 2 },
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
            { text: 'Listening', alignment: 'center' },
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
          { text: 'Listening', alignment: 'center' },
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

  private static isArrayReadingB2C1ExistTwo(array: any): any {
    if (array.length > 1) {
      return [
        [
          { text: 'Reading', alignment: 'center', rowSpan: 2 },
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
          { text: 'Reading', alignment: 'center' },
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
          { text: 'Reading', alignment: 'center' },
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

  private static isArrayUseOfEnglishB2C1ExistTwo(array: any): any {
    if (array.length > 1) {
      return [
        [
          { text: 'Use of English', alignment: 'center', rowSpan: 2 },
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
          { text: 'Use of English', alignment: 'center' },
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
          { text: 'Use of English', alignment: 'center' },
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

  private static isArrayWritingB2C1ExistTwo(array: any): any {
    if (array.length > 1) {
      return [
        [
          { text: 'Writing', alignment: 'center', rowSpan: 2 },
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
          { text: 'Writing', alignment: 'center' },
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
          { text: 'Writing', alignment: 'center' },
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

  private static isArraySpeakingB2C1ExistTwo(array: any): any {
    if (array.length > 1) {
      return [
        [
          { text: 'Speaking', alignment: 'center', rowSpan: 2 },
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
          { text: 'Speaking', alignment: 'center' },
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
          { text: 'Speaking', alignment: 'center' },
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

  public static generateTableOfB2C1ExamsThreeTerms(form: FormGroup): any {
    return {
      style: 'marksTable',
      table: {
        widths: [125, 75, 50, '*'],
        headerRows: 1,
        body: [
          this.initHeaderInTable(),
          ...this.isArrayListeningB2C1ExistThree(form.value.listeningB2C1Array),
          ...this.isArrayReadingB2C1ExistThree(form.value.readingB2C1Array),
          ...this.isArrayUseOfEnglishB2C1ExistThree(
            form.value.useOfEnglishB2C1Array
          ),
          ...this.isArrayWritingB2C1ExistThree(form.value.writingB2C1Array),
          ...this.isArraySpeakingB2C1ExistThree(form.value.speakingB2C1Array),
        ],
      },
    };
  }

  private static isArrayListeningB2C1ExistThree(array: any): any {
    if (array.length > 2) {
      return [
        [
          { text: 'Listening', alignment: 'center', rowSpan: 3 },
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
          { text: 'Listening', alignment: 'center', rowSpan: 2 },
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
          { text: 'Listening', alignment: 'center' },
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
          { text: 'Listening', alignment: 'center' },
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

  private static isArrayReadingB2C1ExistThree(array: any): any {
    if (array.length > 2) {
      return [
        [
          { text: 'Reading', alignment: 'center', rowSpan: 3 },
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
          { text: 'Reading', alignment: 'center', rowSpan: 2 },
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
          { text: 'Reading', alignment: 'center' },
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
          { text: 'Reading', alignment: 'center' },
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

  private static isArrayUseOfEnglishB2C1ExistThree(array: any): any {
    if (array.length > 2) {
      return [
        [
          { text: 'Use of English', alignment: 'center', rowSpan: 3 },
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
          { text: 'Use of English', alignment: 'center', rowSpan: 2 },
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
          { text: 'Use of English', alignment: 'center' },
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
          { text: 'Use of English', alignment: 'center' },
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

  private static isArrayWritingB2C1ExistThree(array: any): any {
    if (array.length > 2) {
      return [
        [
          { text: 'Writing', alignment: 'center', rowSpan: 3 },
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
          { text: 'Writing', alignment: 'center', rowSpan: 2 },
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
          { text: 'Writing', alignment: 'center' },
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
          { text: 'Writing', alignment: 'center' },
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

  private static isArraySpeakingB2C1ExistThree(array: any): any {
    if (array.length > 2) {
      return [
        [
          { text: 'Speaking', alignment: 'center', rowSpan: 3 },
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
          { text: 'Speaking', alignment: 'center', rowSpan: 2 },
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
          { text: 'Speaking', alignment: 'center' },
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
          { text: 'Speaking', alignment: 'center' },
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
