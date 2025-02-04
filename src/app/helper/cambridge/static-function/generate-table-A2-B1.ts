import { FormGroup } from '@angular/forms';

export class GenerateTableA2B1 {
  public static generateTableOfA2B1Exams(form: FormGroup) {
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
            { text: 'Słuchanie', alignment: 'center', rowSpan: 3 },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.listeningA2B1Array[0].date
                  ? new Date(
                      form.value.listeningA2B1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA2B1Array[0].score
                  ? `${form.value.listeningA2B1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA2B1Array[0].result
                  ? form.value.listeningA2B1Array[0].result
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
                form.value.listeningA2B1Array[1].date
                  ? new Date(
                      form.value.listeningA2B1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA2B1Array[1].score
                  ? `${form.value.listeningA2B1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA2B1Array[1].result
                  ? form.value.listeningA2B1Array[1].result
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
                form.value.listeningA2B1Array[2].date
                  ? new Date(
                      form.value.listeningA2B1Array[2].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA2B1Array[2].score
                  ? `${form.value.listeningA2B1Array[2].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA2B1Array[2].result
                  ? form.value.listeningA2B1Array[2].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Czytanie', alignment: 'center', rowSpan: 3 },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.readingA2B1Array[0].date
                  ? new Date(
                      form.value.readingA2B1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingA2B1Array[0].score
                  ? `${form.value.readingA2B1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingA2B1Array[0].result
                  ? form.value.readingA2B1Array[0].result
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
                form.value.readingA2B1Array[1].date
                  ? new Date(
                      form.value.readingA2B1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingA2B1Array[1].score
                  ? `${form.value.readingA2B1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingA2B1Array[1].result
                  ? form.value.readingA2B1Array[1].result
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
                form.value.readingA2B1Array[2].date
                  ? new Date(
                      form.value.readingA2B1Array[2].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingA2B1Array[2].score
                  ? `${form.value.readingA2B1Array[2].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingA2B1Array[2].result
                  ? form.value.readingA2B1Array[2].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Pisanie', alignment: 'center', rowSpan: 3 },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.writingA2B1Array[0].date
                  ? new Date(
                      form.value.writingA2B1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingA2B1Array[0].score
                  ? `${form.value.writingA2B1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingA2B1Array[0].result
                  ? form.value.writingA2B1Array[0].result
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
                form.value.writingA2B1Array[1].date
                  ? new Date(
                      form.value.writingA2B1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingA2B1Array[1].score
                  ? `${form.value.writingA2B1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingA2B1Array[1].result
                  ? form.value.writingA2B1Array[1].result
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
                form.value.writingA2B1Array[2].date
                  ? new Date(
                      form.value.writingA2B1Array[2].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingA2B1Array[2].score
                  ? `${form.value.writingA2B1Array[2].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingA2B1Array[2].result
                  ? form.value.writingA2B1Array[2].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Mówienie', alignment: 'center', rowSpan: 3 },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.speakingA2B1Array[0].date
                  ? new Date(
                      form.value.speakingA2B1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA2B1Array[0].score
                  ? `${form.value.speakingA2B1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA2B1Array[0].result
                  ? form.value.speakingA2B1Array[0].result
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
                form.value.speakingA2B1Array[1].date
                  ? new Date(
                      form.value.speakingA2B1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA2B1Array[1].score
                  ? `${form.value.speakingA2B1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA2B1Array[1].result
                  ? form.value.speakingA2B1Array[1].result
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
                form.value.speakingA2B1Array[2].date
                  ? new Date(
                      form.value.speakingA2B1Array[2].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA2B1Array[2].score
                  ? `${form.value.speakingA2B1Array[2].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA2B1Array[2].result
                  ? form.value.speakingA2B1Array[2].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
        ],
      },
    };
  }

  public static generateTableOfA2B1ExamsTwoTerm(form: FormGroup) {
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
            { text: 'Słuchanie', alignment: 'center', rowSpan: 2 },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.listeningA2B1Array[0].date
                  ? new Date(
                      form.value.listeningA2B1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA2B1Array[0].score
                  ? `${form.value.listeningA2B1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA2B1Array[0].result
                  ? form.value.listeningA2B1Array[0].result
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
                form.value.listeningA2B1Array[1].date
                  ? new Date(
                      form.value.listeningA2B1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA2B1Array[1].score
                  ? `${form.value.listeningA2B1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA2B1Array[1].result
                  ? form.value.listeningA2B1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Czytanie', alignment: 'center', rowSpan: 2 },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.readingA2B1Array[0].date
                  ? new Date(
                      form.value.readingA2B1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingA2B1Array[0].score
                  ? `${form.value.readingA2B1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingA2B1Array[0].result
                  ? form.value.readingA2B1Array[0].result
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
                form.value.readingA2B1Array[1].date
                  ? new Date(
                      form.value.readingA2B1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingA2B1Array[1].score
                  ? `${form.value.readingA2B1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingA2B1Array[1].result
                  ? form.value.readingA2B1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Pisanie', alignment: 'center', rowSpan: 2 },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.writingA2B1Array[0].date
                  ? new Date(
                      form.value.writingA2B1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingA2B1Array[0].score
                  ? `${form.value.writingA2B1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingA2B1Array[0].result
                  ? form.value.writingA2B1Array[0].result
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
                form.value.writingA2B1Array[1].date
                  ? new Date(
                      form.value.writingA2B1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingA2B1Array[1].score
                  ? `${form.value.writingA2B1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingA2B1Array[1].result
                  ? form.value.writingA2B1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Mówienie', alignment: 'center', rowSpan: 2 },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.speakingA2B1Array[0].date
                  ? new Date(
                      form.value.speakingA2B1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA2B1Array[0].score
                  ? `${form.value.speakingA2B1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA2B1Array[0].result
                  ? form.value.speakingA2B1Array[0].result
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
                form.value.speakingA2B1Array[1].date
                  ? new Date(
                      form.value.speakingA2B1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA2B1Array[1].score
                  ? `${form.value.speakingA2B1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA2B1Array[1].result
                  ? form.value.speakingA2B1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
        ],
      },
    };
  }

  public static generateTableOfA2B1ExamsOneTerm(form: FormGroup) {
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
            { text: 'Słuchanie', alignment: 'center' },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.listeningA2B1Array[0].date
                  ? new Date(
                      form.value.listeningA2B1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA2B1Array[0].score
                  ? `${form.value.listeningA2B1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA2B1Array[0].result
                  ? form.value.listeningA2B1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Czytanie', alignment: 'center' },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.readingA2B1Array[0].date
                  ? new Date(
                      form.value.readingA2B1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingA2B1Array[0].score
                  ? `${form.value.readingA2B1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.readingA2B1Array[0].result
                  ? form.value.readingA2B1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Pisanie', alignment: 'center' },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.writingA2B1Array[0].date
                  ? new Date(
                      form.value.writingA2B1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingA2B1Array[0].score
                  ? `${form.value.writingA2B1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingA2B1Array[0].result
                  ? form.value.writingA2B1Array[0].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Mówienie', alignment: 'center' },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.speakingA2B1Array[0].date
                  ? new Date(
                      form.value.speakingA2B1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA2B1Array[0].score
                  ? `${form.value.speakingA2B1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA2B1Array[0].result
                  ? form.value.speakingA2B1Array[0].result
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
