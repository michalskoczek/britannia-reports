import { FormGroup } from '@angular/forms';

export class GenerateTableB2C1 {
  public static generateTableOfB2C1Exams(form: FormGroup): any {
    return {
      style: 'marksTable',
      table: {
        widths: ['*', 'auto', 'auto', 'auto', '*'],
        headerRows: 1,
        body: [
          [
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
          ],
          [
            { text: 'Listening', alignment: 'center', rowSpan: 3 },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.listeningB2C1Array[0].date
                  ? new Date(
                      form.value.listeningB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningB2C1Array[0].score
                  ? `${form.value.listeningB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningB2C1Array[0].result
                  ? form.value.listeningB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            {},
            { text: `2`, alignment: 'center' },
            {
              text: `${
                form.value.listeningB2C1Array[1].date
                  ? new Date(
                      form.value.listeningB2C1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningB2C1Array[1].score
                  ? `${form.value.listeningB2C1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningB2C1Array[1].result
                  ? form.value.listeningB2C1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: `3`, alignment: 'center' },
            {
              text: `${
                form.value.listeningB2C1Array[2].date
                  ? new Date(
                      form.value.listeningB2C1Array[2].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningB2C1Array[2].score
                  ? `${form.value.listeningB2C1Array[2].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningB2C1Array[2].result
                  ? form.value.listeningB2C1Array[2].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Reading', alignment: 'center', rowSpan: 3 },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.readingB2C1Array[0].date
                  ? new Date(
                      form.value.readingB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingB2C1Array[0].score
                  ? `${form.value.readingB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingB2C1Array[0].result
                  ? form.value.readingB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: `2`, alignment: 'center' },
            {
              text: `${
                form.value.readingB2C1Array[1].date
                  ? new Date(
                      form.value.readingB2C1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingB2C1Array[1].score
                  ? `${form.value.readingB2C1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingB2C1Array[1].result
                  ? form.value.readingB2C1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: `3`, alignment: 'center' },
            {
              text: `${
                form.value.readingB2C1Array[2].date
                  ? new Date(
                      form.value.readingB2C1Array[2].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingB2C1Array[2].score
                  ? `${form.value.readingB2C1Array[2].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingB2C1Array[2].result
                  ? form.value.readingB2C1Array[2].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Use of English', alignment: 'center', rowSpan: 3 },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[0].date
                  ? new Date(
                      form.value.useOfEnglishB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[0].score
                  ? `${form.value.useOfEnglishB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[0].result
                  ? form.value.useOfEnglishB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: `2`, alignment: 'center' },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[1].date
                  ? new Date(
                      form.value.useOfEnglishB2C1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[1].score
                  ? `${form.value.useOfEnglishB2C1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[1].result
                  ? form.value.useOfEnglishB2C1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: `3`, alignment: 'center' },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[2].date
                  ? new Date(
                      form.value.useOfEnglishB2C1Array[2].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[2].score
                  ? `${form.value.useOfEnglishB2C1Array[2].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[2].result
                  ? form.value.useOfEnglishB2C1Array[2].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Writing', alignment: 'center', rowSpan: 3 },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.writingB2C1Array[0].date
                  ? new Date(
                      form.value.writingB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingB2C1Array[0].score
                  ? `${form.value.writingB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingB2C1Array[0].result
                  ? form.value.writingB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: '2', alignment: 'center' },
            {
              text: `${
                form.value.writingB2C1Array[1].date
                  ? new Date(
                      form.value.writingB2C1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingB2C1Array[1].score
                  ? `${form.value.writingB2C1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingB2C1Array[1].result
                  ? form.value.writingB2C1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: '3', alignment: 'center' },
            {
              text: `${
                form.value.writingB2C1Array[2].date
                  ? new Date(
                      form.value.writingB2C1Array[2].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingB2C1Array[2].score
                  ? `${form.value.writingB2C1Array[2].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingB2C1Array[2].result
                  ? form.value.writingB2C1Array[2].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Speaking', alignment: 'center', rowSpan: 3 },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.speakingB2C1Array[0].date
                  ? new Date(
                      form.value.speakingB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingB2C1Array[0].score
                  ? `${form.value.speakingB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingB2C1Array[0].result
                  ? form.value.speakingB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: '2', alignment: 'center' },
            {
              text: `${
                form.value.speakingB2C1Array[1].date
                  ? new Date(
                      form.value.speakingB2C1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingB2C1Array[1].score
                  ? `${form.value.speakingB2C1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingB2C1Array[1].result
                  ? form.value.speakingB2C1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: '3', alignment: 'center' },
            {
              text: `${
                form.value.speakingB2C1Array[2].date
                  ? new Date(
                      form.value.speakingB2C1Array[2].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingB2C1Array[2].score
                  ? `${form.value.speakingB2C1Array[2].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingB2C1Array[2].result
                  ? form.value.speakingB2C1Array[2].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
        ],
      },
    };
  }

  public static generateTableOfB2C1ExamsTwoTerm(form: FormGroup): any {
    return {
      style: 'marksTable',
      table: {
        widths: ['*', 'auto', 'auto', 'auto', '*'],
        headerRows: 1,
        body: [
          [
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
          ],
          [
            { text: 'Listening', alignment: 'center', rowSpan: 2 },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.listeningB2C1Array[0].date
                  ? new Date(
                      form.value.listeningB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningB2C1Array[0].score
                  ? `${form.value.listeningB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningB2C1Array[0].result
                  ? form.value.listeningB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            {},
            { text: `2`, alignment: 'center' },
            {
              text: `${
                form.value.listeningB2C1Array[1].date
                  ? new Date(
                      form.value.listeningB2C1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningB2C1Array[1].score
                  ? `${form.value.listeningB2C1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningB2C1Array[1].result
                  ? form.value.listeningB2C1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Reading', alignment: 'center', rowSpan: 2 },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.readingB2C1Array[0].date
                  ? new Date(
                      form.value.readingB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingB2C1Array[0].score
                  ? `${form.value.readingB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingB2C1Array[0].result
                  ? form.value.readingB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: `2`, alignment: 'center' },
            {
              text: `${
                form.value.readingB2C1Array[1].date
                  ? new Date(
                      form.value.readingB2C1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingB2C1Array[1].score
                  ? `${form.value.readingB2C1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingB2C1Array[1].result
                  ? form.value.readingB2C1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Use of English', alignment: 'center', rowSpan: 2 },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[0].date
                  ? new Date(
                      form.value.useOfEnglishB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[0].score
                  ? `${form.value.useOfEnglishB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[0].result
                  ? form.value.useOfEnglishB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: `2`, alignment: 'center' },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[1].date
                  ? new Date(
                      form.value.useOfEnglishB2C1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[1].score
                  ? `${form.value.useOfEnglishB2C1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[1].result
                  ? form.value.useOfEnglishB2C1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Writing', alignment: 'center', rowSpan: 2 },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.writingB2C1Array[0].date
                  ? new Date(
                      form.value.writingB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingB2C1Array[0].score
                  ? `${form.value.writingB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingB2C1Array[0].result
                  ? form.value.writingB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: '2', alignment: 'center' },
            {
              text: `${
                form.value.writingB2C1Array[1].date
                  ? new Date(
                      form.value.writingB2C1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingB2C1Array[1].score
                  ? `${form.value.writingB2C1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingB2C1Array[1].result
                  ? form.value.writingB2C1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Speaking', alignment: 'center', rowSpan: 2 },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.speakingB2C1Array[0].date
                  ? new Date(
                      form.value.speakingB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingB2C1Array[0].score
                  ? `${form.value.speakingB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingB2C1Array[0].result
                  ? form.value.speakingB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            '',
            { text: '2', alignment: 'center' },
            {
              text: `${
                form.value.speakingB2C1Array[1].date
                  ? new Date(
                      form.value.speakingB2C1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingB2C1Array[1].score
                  ? `${form.value.speakingB2C1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingB2C1Array[1].result
                  ? form.value.speakingB2C1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
        ],
      },
    };
  }

  public static generateTableOfB2C1ExamsOneTerm(form: FormGroup): any {
    return {
      style: 'marksTable',
      table: {
        widths: ['*', 'auto', 'auto', 'auto', '*'],
        headerRows: 1,
        body: [
          [
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
          ],
          [
            { text: 'Listening', alignment: 'center' },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.listeningB2C1Array[0].date
                  ? new Date(
                      form.value.listeningB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningB2C1Array[0].score
                  ? `${form.value.listeningB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningB2C1Array[0].result
                  ? form.value.listeningB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Reading', alignment: 'center' },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.readingB2C1Array[0].date
                  ? new Date(
                      form.value.readingB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingB2C1Array[0].score
                  ? `${form.value.readingB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingB2C1Array[0].result
                  ? form.value.readingB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Use of English', alignment: 'center' },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[0].date
                  ? new Date(
                      form.value.useOfEnglishB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[0].score
                  ? `${form.value.useOfEnglishB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.useOfEnglishB2C1Array[0].result
                  ? form.value.useOfEnglishB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Writing', alignment: 'center' },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.writingB2C1Array[0].date
                  ? new Date(
                      form.value.writingB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingB2C1Array[0].score
                  ? `${form.value.writingB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingB2C1Array[0].result
                  ? form.value.writingB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Speaking', alignment: 'center' },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.speakingB2C1Array[0].date
                  ? new Date(
                      form.value.speakingB2C1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingB2C1Array[0].score
                  ? `${form.value.speakingB2C1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingB2C1Array[0].result
                  ? form.value.speakingB2C1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
        ],
      },
    };
  }
}
