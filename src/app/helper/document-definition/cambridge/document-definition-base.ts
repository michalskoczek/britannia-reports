import { GenerateTableBase } from '../../cambridge/static-function/generate-table-base';
import { FormGroup } from '@angular/forms';
import { FileBase64 } from '../../../shared/base64/file-base64';
import { additionalExamInformations } from '../../../shared/exams';

export class DocumentDefinitionBase {
  private static readonly additionalExamInformations: string[] =
    additionalExamInformations;
  private static readonly imageLogo: string = FileBase64.image;
  private static readonly checkmarkLogo: string = FileBase64.checkmarkLogo;
  private static readonly emptyImageLogo: string = FileBase64.emptyImageLogo;

  static initFileName(form: FormGroup): string {
    return form.value.studentName.split(' ').join('-') + '_cambridge_report';
  }

  static initDocumentDefinition(form: FormGroup): any {
    let date: string = new Date(form.value.date).toLocaleDateString();

    let commentsArray: string[] = [];
    form.value.comments.forEach((comment: string) =>
      commentsArray.push(comment)
    );

    let recommendationsArray: string[] = [];
    form.value.recommendations.forEach((comment: string) =>
      recommendationsArray.push(comment)
    );

    return {
      content: [
        {
          text: 'RAPORT Z PRZEPROWADZENIA PRÓBNEGO EGZAMINU CAMBRIDGE',
          style: 'title',
          alignment: 'center',
        },
        {
          text: [
            `Imię i Nazwisko ucznia: `,
            { text: `${form.value.studentName}`, bold: true, fontSize: 13 },
          ],
          margin: [0, 5, 0, 5],
          alignment: 'center',
        },
        {
          style: 'tableExample',
          table: {
            widths: ['auto', '*', 'auto', '*'],
            body: [
              [
                { text: 'Data', style: 'tableHeader' },
                { text: `${date}` },
                { text: 'Klasa', style: 'tableHeader' },
                { text: `${form.value.class}` },
              ],
              [
                { text: 'Lektor', style: 'tableHeader' },
                { text: `${form.value.teacher}` },
                { text: 'Kurs', style: 'tableHeader' },
                { text: `${form.value.course}` },
              ],
            ],
          },
        },
        {
          text: 'Poziom biegłości',
          style: 'header',
          margin: [0, 10, 0, 5],
        },
        {
          text:
            'Zależy nam na tym, by jak najwcześniej diagnozować poziom umiejętności dzieci, by jak najszybciej łączyć je w grupy według poziomu ich umiejętności, by mogły rozwijać się językowo w swoim tempie i jak najpełniej korzystać z lekcji. Jak co roku została przeprowadzona diagnoza poziomu języka naszych uczniów według Europejskiego Systemu Kształcenia Językowego z wykorzystaniem próbnych egzaminów Cambridge. \n' +
            '\n' +
            'Testy Cambridge dla dzieci to testy przekrojowe, diagnostyczne - nie można ich nie zdać, mają wskazać poziom biegłości językowej. Ważne są procenty. Uznajemy, że uczeń wskoczył na dany poziom biegłości, jeśli uzyskał minimum 60%. Jednak, by stwierdzić, że uczeń faktycznie osiągnął dany poziom językowy i może przystąpić do oficjalnego egzaminu Cambridge, powinien osiągnąć on ok. 80% z testów próbnych. Na testach próbnych diagnozujemy umiejętności Słuchania oraz Czytania i Pisania. Na egzaminie jest też Mówienie, co ćwiczymy i sprawdzamy na bieżąco.',
          fontSize: 9,
        },
        {
          text: ['Rodzaj egzaminu: ', form.value.typeOfExam],
          margin: [0, 10, 0, 0],
          style: 'header',
        },
        GenerateTableBase.chooseTableOfExam(form),
        {
          text: `${commentsArray.length > 0 ? 'Komentarz' : ''}`,
          style: 'subheader',
        },
        {
          ul: commentsArray,
          fontSize: 10,
        },
        {
          text: 'REKOMENDACJA EGZAMINACYJNA',
          style: 'header',
          margin: [0, 25, 0, 5],
        },
        {
          style: 'tableExample',
          table: {
            widths: ['auto', '*'],
            body: [
              [
                {
                  text: 'Rekomendacje egzaminacyjne zostaną przekazane po kolejnym próbnym teście Cambridge.',
                },
                {
                  image: `${
                    form.value.examRecommendationOptions === '1'
                      ? this.checkmarkLogo
                      : this.emptyImageLogo
                  }`,
                  width: 15,
                  height: 15,
                  alignment: 'center',
                },
              ],
              [
                {
                  text: 'Nie rekomenduję wzięcia udziału w czerwcowej sesji egzaminacyjnej Cambridge w tym roku szkolnym.',
                },
                {
                  image: `${
                    form.value.examRecommendationOptions === '2'
                      ? this.checkmarkLogo
                      : this.emptyImageLogo
                  }`,
                  width: 15,
                  height: 15,
                  alignment: 'center',
                },
              ],
              [
                {
                  text:
                    'Rekomenduję wzięcie udziału w czerwcowej sesji egzaminacyjnej Cambridge w tym roku szkolnym. ' +
                    `${
                      form.value.examRecommendationResult
                        ? `Rekomenduję podejście do egzaminu: ${form.value.examRecommendationResult}`
                        : ''
                    }`,
                },
                {
                  image: `${
                    form.value.examRecommendationOptions === '3'
                      ? this.checkmarkLogo
                      : this.emptyImageLogo
                  }`,
                  width: 15,
                  height: 15,
                  alignment: 'center',
                },
              ],
            ],
          },
        },
        {
          text: 'Dodatkowe informacje egzaminacyjne',
          style: 'header',
          margin: [0, 10, 0, 5],
        },
        {
          ul: this.additionalExamInformations,
          fontSize: 9,
        },
        {
          columns: [
            {
              text: form.value.signature,
              margin: [0, 20, 0, 10],
              fontSize: 10,
            },
            {
              image: this.imageLogo,
              width: 125,
              height: 110,
              alignment: 'right',
              margin: [0, 20, 0, 0],
            },
          ],
        },
      ],
      styles: {
        tableHeader: {
          fontSize: 10,
          bold: true,
        },
        tableExample: {
          margin: [0, 10, 0, 2],
          fontSize: 10,
        },
        tableExams: {
          margin: [0, 10, 0, 10],
          fontSize: 10,
        },
        marksTable: {
          margin: [0, 10, 0, 5],
          fontSize: 10,
        },
        header: {
          bold: true,
          fontSize: 11,
        },
        subheader: {
          fontSize: 10,
          bold: true,
        },
        title: {
          fontSize: 13,
          bold: true,
          alignment: 'justify',
          decoration: 'underline',
        },
        subtitle: {
          fontSize: 11,
          alignment: 'justify',
          bold: true,
        },
        defaultStyle: {
          fontSize: 10,
        },
      },
    };
  }
}
