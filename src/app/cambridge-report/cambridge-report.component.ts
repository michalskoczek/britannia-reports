import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { classes, teachers, courses } from '../shared/select-values';
import { Marks, marks } from '../shared/marks';
import {
  additionalExamInformations,
  examsRecommendations,
  examsSelect,
  learningRecommendations,
  resultOfExam,
} from '../shared/exams';
import { image } from '../shared/images-base64';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-cambridge-report',
  templateUrl: './cambridge-report.component.html',
  styleUrls: ['./cambridge-report.component.scss'],
})
export class CambridgeReportComponent implements OnInit {
  title: string = 'britannia-reports';

  public form!: FormGroup;

  public readonly classes: string[] = classes;
  public readonly teachers: string[] = teachers;
  public readonly courses: string[] = courses;
  public readonly marks: Marks[] = marks;

  public readonly resultOfExam: string[] = resultOfExam;
  public readonly examsSelect: string[] = examsSelect;
  public selectedTypeOfExam: string = '';

  public readonly examsRecommendations: string[] = examsRecommendations;

  public isChecked: boolean = false;

  public learningRecommendations: string[] = learningRecommendations;

  private readonly additionalExamInformations: string[] =
    additionalExamInformations;
  private readonly imageLogo: string = image;
  private readonly checkmarkLogo: string =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAv5JREFUaEPtmDmrFEEUhb8Hboio4C4q4gauKGaCkRsGgmjimoggLoFiZmAomIhooGIgZiIugQgKLmiouP0C/4Br7NrnUSXz+k1P3dvT7fTAVDYzp6rOuffUrVszRJ+PoT7nz0BArzM4yMAgA+kITAfuAeuAE8DN1ilNt9AM4EkmYE0g/Qc4BlyNIposQOSfAqtzSZKIo8A1fd9UAUXko5bfwCHZqYkCZobIr0ocj1/AwaYJEPlnwMr02R5GfGqSgFmB/AojecGeN0WA1Tat2j4Am5sgwGsbiRgm3wQLyTYqlVbPjyDf6zJaxvP/It/ri6wS8kUZWAScAz4CZ4Efjqpggc5V9QCWWcAB8z54/nN+Tv4QrwceAoqQxl1gD/DTsVkn6OzgeU+pHGWbomZuU+j6JucY3AH2ViBC5HVJLXcEQ5HfompTNCdmYD9wAxhbALwN7AN0fZcZ84JtljgmF9omn4HjwGVDYyeBh7NzoUbKM8qQfxc8/yW1kTLwHcjbpmjedeAIoJbWMuaHyC+2gAPGTF54CbgP7HRscAVQ1lIiFgTPe8i/DZ5PRj7ylYCJwKOsOmx0iLgEnOwgokzkTZ7Pc4yHeEoobyqj1nExs9+pNuAykS9FPlooctDj+QXgqdEXgNMtIkRel5QuQ+soTT4vQJ91S74EPL49D5wBlgYrLrQyB94Ez391zBkBbddOi4BEyMfW8Q2YBIyxTqiCfLsMxP0VTdlpjoOQB6pSqRt2VG/jWaSTAP2mvzPk52neRRN4V51P7Z16ka0NIqamFjL+Xin5VAYipw3A4+BxI8+2sMrJWwUIp/fnA2BCSQXuG9a6T8pCrevsANRaj7MuHnCvga3Zza1KVfnwCNDm20PvNN7IpLbIx/29AjRPjZ/eB0Vvh7j2K2BbXZHvRoDm7gJudRBRe+S7FdBJxH8j76lCRZbfHTIRWwj1Njqw5n7eeJYKYWXOQH4x2Umttf49OBBeeN3yMs+vQoB5szqAAwF1RNWz5iADnmjVge37DPwFRASGR52JQuMAAAAASUVORK5CYII=';

  private readonly emptyImageLogo: string =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABICAIAAAD51HXFAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACOSURBVHhe7dAxAQAwEAOh+jedrn8eQAJvHDpCR+gIHaEjdISO0BE6QkfoCB2hI3SEjtAROkJH6AgdoSN0hI7QETpCR+gIHaEjdISO0BE6QkfoCB2hI3SEjtAROkJH6AgdoSN0hI7QETpCR+gIHaEjdISO0BE6QkfoCB2hI3SEjtAROkJH6AgdoSN0hI5j+48/qHbII7vkAAAAAElFTkSuQmCC';

  ngOnInit(): void {
    this.form = this.createForm();
  }

  get comments(): FormArray {
    return this.form.get('comments') as FormArray;
  }

  get recommendations(): FormArray {
    return this.form.get('recommendations') as FormArray;
  }

  get listeningA1Array(): FormArray {
    return this.form.get('listeningA1Array') as FormArray;
  }

  get writingAndReadingA1Array(): FormArray {
    return this.form.get('writingAndReadingA1Array') as FormArray;
  }

  get speakingA1Array(): FormArray {
    return this.form.get('speakingA1Array') as FormArray;
  }

  get listeningA2B1Array(): FormArray {
    return this.form.get('listeningA2B1Array') as FormArray;
  }

  get readingA2B1Array(): FormArray {
    return this.form.get('readingA2B1Array') as FormArray;
  }

  get writingA2B1Array(): FormArray {
    return this.form.get('writingA2B1Array') as FormArray;
  }

  get speakingA2B1Array(): FormArray {
    return this.form.get('speakingA2B1Array') as FormArray;
  }

  get listeningB2C1Array(): FormArray {
    return this.form.get('listeningB2C1Array') as FormArray;
  }

  get readingB2C1Array(): FormArray {
    return this.form.get('readingB2C1Array') as FormArray;
  }

  get useOfEnglishB2C1Array(): FormArray {
    return this.form.get('useOfEnglishB2C1Array') as FormArray;
  }

  get writingB2C1Array(): FormArray {
    return this.form.get('writingB2C1Array') as FormArray;
  }

  get speakingB2C1Array(): FormArray {
    return this.form.get('speakingB2C1Array') as FormArray;
  }

  public addNextComment(): void {
    this.comments.push(new FormControl(null));
  }

  public onSelectTypeOfExam(exam: string): void {
    this.selectedTypeOfExam = exam;
  }

  public onCheckboxChange(): void {
    this.isChecked = !this.isChecked;
  }

  public onCheckboxChangeRecommendation(): void {
    this.isChecked = false;
    this.form.get('examRecommendationResult')?.setValue(null);
  }

  public onRemoveComment(index: number): void {
    this.comments.removeAt(index);
  }

  public addNextExamTerm(nameOfArray: string): void {
    const arr = this.form.get(nameOfArray) as FormArray;
    arr.push(
      new FormGroup({
        date: new FormControl(null),
        score: new FormControl(null),
        result: new FormControl(null),
      })
    );
  }

  public onRemoveExamTerm(index: number, nameOfArray: string): void {
    const control = <FormArray>this.form.controls[nameOfArray];
    control.removeAt(index);
  }

  public generatePDF(form: FormGroup): any {
    console.log(form.value);
    let date: string = new Date(form.value.date).toLocaleDateString();

    let commentsArray: string[] = [];
    form.value.comments.forEach((comment: string) =>
      commentsArray.push(comment)
    );

    let recommendationsArray: string[] = [];
    form.value.recommendations.forEach((comment: string) =>
      recommendationsArray.push(comment)
    );

    const chooseTableOfExam = () => {
      if (
        form.value.typeOfExam === 'Cambridge STARTERS' ||
        form.value.typeOfExam === 'Cambridge MOVERS' ||
        form.value.typeOfExam === 'Cambridge FLYERS'
      ) {
        if (
          form.value.listeningA1Array.length === 2 ||
          form.value.writingAndReadingA1Array.length === 2 ||
          form.value.speakingA1Array.length === 2
        ) {
          return this.generateTableOfA1ExamsTwoTerm(form);
        } else if (
          form.value.listeningA1Array.length === 1 ||
          form.value.writingAndReadingA1Array.length === 1 ||
          form.value.speakingA1Array.length === 1
        ) {
          return this.generateTableOfA1ExamsOneTerm(form);
        } else return this.generateTableOfA1Exams(form);
      } else if (
        form.value.typeOfExam === 'Cambridge A2 Key for Schools' ||
        form.value.typeOfExam === 'Cambridge B1 Preliminary for Schools'
      ) {
        if (form.value.listeningA2B1Array.length === 2) {
          return this.generateTableOfA2B1ExamsTwoTerm(form);
        } else if (form.value.listeningA2B1Array.length === 1) {
          return this.generateTableOfA2B1ExamsOneTerm(form);
        } else return this.generateTableOfA2B1Exams(form);
      } else if (
        form.value.typeOfExam === 'Cambridge B2 First for Schools' ||
        form.value.typeOfExam === 'Cambridge C1 Advanced'
      ) {
        if (form.value.listeningB2C1Array.length === 2) {
          return this.generateTableOfB2C1ExamsTwoTerm(form);
        } else if (form.value.listeningB2C1Array.length === 1) {
          return this.generateTableOfB2C1ExamsOneTerm(form);
        } else return this.generateTableOfB2C1Exams(form);
      } else return null;
    };

    let docDefinition = {
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
        chooseTableOfExam(),
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

    const fileName: string =
      form.value.studentName.split(' ').join('-') + '_cambridge_report';
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  private generateTableOfA1Exams(form: FormGroup) {
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
          this.isArrayListeningA1Exist(form.value.listeningA1Array),
          [
            { text: 'Czytanie i Pisanie', alignment: 'center', rowSpan: 3 },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.writingAndReadingA1Array[0].date
                  ? new Date(
                      form.value.writingAndReadingA1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingAndReadingA1Array[0].score
                  ? `${form.value.writingAndReadingA1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingAndReadingA1Array[0].result
                  ? form.value.writingAndReadingA1Array[0].result
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
                form.value.writingAndReadingA1Array[1].date
                  ? new Date(
                      form.value.writingAndReadingA1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingAndReadingA1Array[1].score
                  ? `${form.value.writingAndReadingA1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingAndReadingA1Array[1].result
                  ? form.value.writingAndReadingA1Array[1].result
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
                form.value.writingAndReadingA1Array[2].date
                  ? new Date(
                      form.value.writingAndReadingA1Array[2].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingAndReadingA1Array[2].score
                  ? `${form.value.writingAndReadingA1Array[2].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingAndReadingA1Array[2].result
                  ? form.value.writingAndReadingA1Array[2].result
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
                form.value.speakingA1Array[0].date
                  ? new Date(
                      form.value.speakingA1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA1Array[0].score
                  ? `${form.value.speakingA1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA1Array[0].result
                  ? form.value.speakingA1Array[0].result
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
                form.value.speakingA1Array[1].date
                  ? new Date(
                      form.value.speakingA1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA1Array[1].score
                  ? `${form.value.speakingA1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA1Array[1].result
                  ? form.value.speakingA1Array[1].result
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
                form.value.speakingA1Array[2].date
                  ? new Date(
                      form.value.speakingA1Array[2].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA1Array[2].score
                  ? `${form.value.speakingA1Array[2].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA1Array[2].result
                  ? form.value.speakingA1Array[2].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
        ],
      },
    };
  }

  private generateTableOfA1ExamsTwoTerm(form: FormGroup) {
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
          [
            { text: 'Słuchanie', alignment: 'center', rowSpan: 2 },
            { text: '1', alignment: 'center' },
            {
              text: `${
                form.value.listeningA1Array[0].date
                  ? new Date(
                      form.value.listeningA1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA1Array[0].score
                  ? `${form.value.listeningA1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA1Array[0].result
                  ? form.value.listeningA1Array[0].result
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
                form.value.listeningA1Array[1].date
                  ? new Date(
                      form.value.listeningA1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA1Array[1].score
                  ? `${form.value.listeningA1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA1Array[1].result
                  ? form.value.listeningA1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
          [
            { text: 'Czytanie i Pisanie', alignment: 'center', rowSpan: 2 },
            { text: `1`, alignment: 'center' },
            {
              text: `${
                form.value.writingAndReadingA1Array[0].date
                  ? new Date(
                      form.value.writingAndReadingA1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingAndReadingA1Array[0].score
                  ? `${form.value.writingAndReadingA1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingAndReadingA1Array[0].result
                  ? form.value.writingAndReadingA1Array[0].result
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
                form.value.writingAndReadingA1Array[1].date
                  ? new Date(
                      form.value.writingAndReadingA1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingAndReadingA1Array[1].score
                  ? `${form.value.writingAndReadingA1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.writingAndReadingA1Array[1].result
                  ? form.value.writingAndReadingA1Array[1].result
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
                form.value.speakingA1Array[0].date
                  ? new Date(
                      form.value.speakingA1Array[0].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA1Array[0].score
                  ? `${form.value.speakingA1Array[0].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA1Array[0].result
                  ? form.value.speakingA1Array[0].result
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
                form.value.speakingA1Array[1].date
                  ? new Date(
                      form.value.speakingA1Array[1].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA1Array[1].score
                  ? `${form.value.speakingA1Array[1].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.speakingA1Array[1].result
                  ? form.value.speakingA1Array[1].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
        ],
      },
    };
  }

  private generateTableOfA1ExamsOneTerm(form: FormGroup) {
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

          this.isArrayListeningA1Exist(form.value.listeningA1Array),
          this.isArrayReadingWritingA1Exist(
            form.value.writingAndReadingA1Array
          ),
          this.isArraySpeakingA1Exist(form.value.speakingA1Array),
        ],
      },
    };
  }

  private isArrayListeningA1Exist(array: any): any {
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

  private isArrayReadingWritingA1Exist(array: any) {
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

  private isArraySpeakingA1Exist(array: any) {
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

  private generateTableOfA2B1Exams(form: FormGroup) {
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

  private generateTableOfA2B1ExamsTwoTerm(form: FormGroup) {
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

  private generateTableOfA2B1ExamsOneTerm(form: FormGroup) {
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

  private generateTableOfB2C1Exams(form: FormGroup) {
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

  private generateTableOfB2C1ExamsTwoTerm(form: FormGroup) {
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

  private generateTableOfB2C1ExamsOneTerm(form: FormGroup) {
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

  private createForm(): FormGroup {
    return new FormGroup({
      studentName: new FormControl(null, Validators.required),
      name: new FormControl(null),
      sex: new FormControl(null),
      date: new FormControl(null),
      class: new FormControl(null),
      teacher: new FormControl(null),
      studentBookTitle: new FormControl(null),
      ownTitleStudentBook: new FormControl(null),
      ownEducationMaterial: new FormControl(false),
      course: new FormControl(null),
      realizedMaterial: new FormControl(null),

      marks: new FormControl(null),
      avgMark: new FormControl(null),
      frequency: new FormControl(null),
      lead: new FormControl(null),
      respect: new FormControl(null),
      focus: new FormControl(null),
      pronunciation: new FormControl(null),
      vocabulary: new FormControl(null),
      prepareToLecture: new FormControl(null),
      homeworks: new FormControl(null),
      involvement: new FormControl(null),
      behaviour: new FormControl(null),

      typeOfExam: new FormControl(null),

      listeningA1Array: new FormArray([]),
      writingAndReadingA1Array: new FormArray([]),
      speakingA1Array: new FormArray([]),

      listeningA2B1Array: new FormArray([]),
      readingA2B1Array: new FormArray([]),
      writingA2B1Array: new FormArray([]),
      speakingA2B1Array: new FormArray([]),

      listeningB2C1Array: new FormArray([]),
      readingB2C1Array: new FormArray([]),
      useOfEnglishB2C1Array: new FormArray([]),
      writingB2C1Array: new FormArray([]),
      speakingB2C1Array: new FormArray([]),

      comments: new FormArray([]),

      examRecommendationInNextTermCheckbox: new FormControl(false),
      examRecommendationAcceptCheckbox: new FormControl(false),
      examRecommendationNonCheckbox: new FormControl(false),
      examRecommendationCheckbox: new FormControl(false),
      examRecommendationResult: new FormControl(null),
      examRecommendation: new FormControl(''),
      examRecommendationOptions: new FormControl(null),

      learningRecommendations: new FormControl(null),
      recommendations: new FormArray([]),

      signature: new FormControl(null),
    });
  }
}
