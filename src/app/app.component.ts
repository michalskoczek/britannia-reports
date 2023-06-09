import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ELEMENT_DATA, TableElement } from './rating-scale/table-elements';
import { classes, teachers, books, courses } from './shared/select-values';
import {
  behaviourMarks,
  homeworksMarks,
  involvementMarks,
  Marks,
  marks,
  prepareToLectureMarks,
  pronunciationMarks,
  vocabularyMarks,
} from './shared/marks';
import {
  additionalExamInformations,
  examsRecommendations,
  examsSelect,
  learningRecommendations,
  resultOfExam,
} from './shared/exams';
import { image } from './shared/images-base64';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title: string = 'britannia-reports';

  public form!: FormGroup;

  public readonly sexes: string[] = ['Uczeń', 'Uczennica'];
  public readonly classes: string[] = classes;
  public readonly teachers: string[] = teachers;
  public readonly books: string[] = books;
  public readonly courses: string[] = courses;

  public readonly displayedColumns: string[] = ['percent', 'mark'];
  public readonly dataSource: TableElement[] = ELEMENT_DATA;

  public readonly marks: Marks[] = marks;

  public readonly pronunciationMarks: Marks[] = pronunciationMarks;
  public readonly vocabularyMarks: Marks[] = vocabularyMarks;
  public readonly prepareToLectureMarks: Marks[] = prepareToLectureMarks;
  public readonly homeworksMarks: Marks[] = homeworksMarks;
  public readonly involvementMarks: Marks[] = involvementMarks;
  public readonly behaviourMarks: Marks[] = behaviourMarks;

  public readonly resultOfExam: string[] = resultOfExam;
  public readonly examsSelect: string[] = examsSelect;
  public selectedTypeOfExam: string = '';

  public readonly examsRecommendations: string[] = examsRecommendations;

  public isChecked: boolean = false;

  public learningRecommendations: string[] = learningRecommendations;

  private readonly additionalExamInformations: string[] =
    additionalExamInformations;
  private readonly imageLogo: string = image;

  ngOnInit(): void {
    this.form = this.createForm();

    // this.createExamsFormArray();
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

  public addNextRecommendation(): void {
    this.recommendations.push(new FormControl(null));
  }

  public onSelectTypeOfExam(exam: string): void {
    this.selectedTypeOfExam = exam;
  }

  public onCheckboxChange(): void {
    this.isChecked = !this.isChecked;
  }

  public onRemoveComment(index: number): void {
    this.comments.removeAt(index);
  }

  public onRemoveRecommendation(index: number): void {
    this.recommendations.removeAt(index);
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

    const changeXToStudentName = (
      textValue: string,
      studentName: string
    ): string => {
      return textValue.replace(textValue[0], studentName);
    };

    const changeXToYValue = (textValue: string, yValue: string): string => {
      return textValue.replace(textValue[0], yValue);
    };

    const changeXToEmptyValue = (textValue: string): string => {
      return textValue.replace(textValue[0], '');
    };

    const getMarkValue = (
      selectedValue: string,
      marks: Marks[]
    ): string | undefined => {
      let markObj: Marks | undefined = marks.find(
        (mark: Marks): boolean => mark.value === selectedValue
      );
      return markObj?.viewValue[0];
    };

    const chooseTableOfExam = () => {
      if (
        form.value.typeOfExam === 'Cambridge STARTERS' ||
        form.value.typeOfExam === 'Cambridge MOVERS' ||
        form.value.typeOfExam === 'Cambridge FLYERS'
      ) {
        if (form.value.listeningA1Array.length === 2) {
          return this.generateTableOfA1ExamsTwoTerm(form);
        } else if (form.value.listeningA1Array.length === 1) {
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
          text: 'PODSUMOWANIE NAUKI i DALSZE REKOMENDACJE',
          style: 'title',
          alignment: 'center',
        },
        {
          text: [
            `Imię i Nazwisko ucznia: `,
            { text: `${form.value.studentName}`, style: 'subtitle' },
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
                { text: 'Tytuł podręcznika', style: 'tableHeader' },
                { text: `${form.value.studentBookTitle}` },
              ],
              [
                { text: 'Kurs', style: 'tableHeader' },
                { text: `${form.value.course}` },
                { text: 'Zrealizowany materiał', style: 'tableHeader' },
                { text: `${form.value.realizedMaterial}` },
              ],
            ],
          },
        },
        {
          style: 'tableExample',
          table: {
            widths: ['auto', 'auto', 'auto', 'auto', '*'],
            headerRows: 1,
            body: [
              [
                {
                  text: 'Nasza skala ocen',
                  style: 'tableHeader',
                  colSpan: 2,
                  alignment: 'center',
                },
                {},
                {
                  text: '',
                  rowSpan: 1,
                },
                {
                  text: 'Uzyskane oceny',
                  style: 'tableHeader',
                  colSpan: 2,
                  alignment: 'center',
                },
                {},
              ],
              [
                {
                  text: '100%+',
                },
                {
                  text: '6*',
                },
                {
                  text: '',
                  rowSpan: 12,
                },
                {
                  colSpan: 2,
                  rowSpan: 9,
                  text: `${form.value.marks}`,
                  style: 'tableHeader',
                },
                {},
              ],
              [
                {
                  text: '96-100%',
                },
                {
                  text: '5',
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '90-95%',
                },
                {
                  text: '5-',
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '85-89%',
                },
                {
                  text: '4+',
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '80-84%',
                },
                {
                  text: '4',
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '75-79%',
                },
                {
                  text: '4-',
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '70-74%',
                },
                {
                  text: '3+',
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '64-69%',
                },
                {
                  text: '3',
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '60-63%',
                },
                {
                  text: '3-',
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '55-59%',
                },
                {
                  text: '2+',
                },
                '',
                {
                  text: 'Opis oceny można znaleźć w dzienniku EduSky',
                  colSpan: 2,
                  fontSize: 10,
                },
                '',
              ],
              [
                {
                  text: '45-54%',
                },
                {
                  text: '2',
                },
                '',
                {
                  text: 'Bieżące postępy (średnia ocen)',
                  style: 'tableHeader',
                },
                {
                  text: `${form.value.avgMark}`,
                },
              ],
              [
                {
                  text: '0-44%',
                },
                {
                  text: '1',
                },
                '',
                {
                  text: 'Frekwencja',
                  style: 'tableHeader',
                },
                {
                  text: `${form.value.frequency}%`,
                },
              ],
            ],
          },
          layout: {
            defaultBorder: true,
          },
        },
        {
          text: '* Ocena celująca przyznawana jest za osiągnięcia specjalne, w szczególności za wyróżniające się odpowiedzi ustne lub pisemne.',
          fontSize: 7,
        },
        // {
        //   style: 'tableExample',
        //   table: {
        //     widths: ['*', 'auto'],
        //     headerRows: 1,
        //     body: [
        //       [
        //         {
        //           text: 'Kategoria',
        //           style: 'tableHeader',
        //           alignment: 'center',
        //         },
        //         { text: 'Ocena', style: 'tableHeader', alignment: 'center' },
        //       ],
        //       [
        //         { text: 'Prowadzenie zeszytu, notatek' },
        //         { text: `${form.value.lead}`, alignment: 'center' },
        //       ],
        //       [
        //         { text: 'Szacunek do nauczyciela i innych kursantów z grupy' },
        //         { text: `${form.value.respect}`, alignment: 'center' },
        //       ],
        //       [
        //         { text: 'Skupienie uwagi na lekcjach' },
        //         { text: `${form.value.focus}`, alignment: 'center' },
        //       ],
        //     ],
        //   },
        // },
        {
          style: 'tableExams',
          table: {
            widths: ['auto', '*', 'auto'],
            headerRows: 1,
            body: [
              [
                {
                  text: 'Kategoria',
                  style: 'tableHeader',
                  alignment: 'center',
                },
                {
                  text: 'Opis',
                  style: 'tableHeader',
                  alignment: 'center',
                },
                {
                  text: 'Ocena',
                  style: 'tableHeader',
                  alignment: 'center',
                },
              ],
              [
                { text: 'Wymowa' },
                {
                  text: `${changeXToStudentName(
                    form.value.pronunciation,
                    form.value.name
                  )}`,
                },
                {
                  text: `${getMarkValue(
                    form.value.pronunciation,
                    pronunciationMarks
                  )}`,
                  alignment: 'center',
                },
              ],
              [
                { text: 'Słownictwo' },
                {
                  text: `${changeXToYValue(
                    form.value.vocabulary,
                    form.value.sex
                  )}`,
                },
                {
                  text: `${getMarkValue(
                    form.value.vocabulary,
                    vocabularyMarks
                  )}`,
                  alignment: 'center',
                },
              ],
              [
                { text: 'Przygotowanie do zajęć' },
                {
                  text: `${changeXToEmptyValue(form.value.prepareToLecture)}`,
                },
                {
                  text: `${getMarkValue(
                    form.value.prepareToLecture,
                    prepareToLectureMarks
                  )}`,
                  alignment: 'center',
                },
              ],
              [
                { text: 'Prace domowe' },
                {
                  text: `${changeXToYValue(
                    form.value.homeworks,
                    form.value.sex
                  )}`,
                },
                {
                  text: `${getMarkValue(form.value.homeworks, homeworksMarks)}`,
                  alignment: 'center',
                },
              ],
              [
                { text: 'Zaangażowanie' },
                {
                  text: `${changeXToStudentName(
                    form.value.involvement,
                    form.value.name
                  )}`,
                },
                {
                  text: `${getMarkValue(
                    form.value.involvement,
                    involvementMarks
                  )}`,
                  alignment: 'center',
                },
              ],
              [
                { text: 'Zachowanie' },
                {
                  text: `${changeXToEmptyValue(form.value.behaviour)}`,
                },
                {
                  text: `${getMarkValue(form.value.behaviour, behaviourMarks)}`,
                  alignment: 'center',
                },
              ],
            ],
          },
        },
        {
          text: 'Poziom biegłości',
          style: 'header',
          margin: [0, 0, 0, 5],
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
          bold: true,
          margin: [0, 10, 0, 0],
          fontSize: 10,
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
          text: 'Rekomendacja egzaminacyjna',
          style: 'header',
          margin: [0, 10, 0, 5],
        },
        {
          text: `${
            form.value.examRecommendationAcceptCheckbox
              ? `W tym roku szkolnym rekomenduję podejście do egzaminu: ${form.value.examRecommendationResult}`
              : `W tym roku nie rekomenduję podchodzenia do egzaminu Cambridge.`
          }`,
          bold: true,
          margin: [0, 0, 0, 5],
          fontSize: 10,
        },
        { text: `${form.value.examRecommendation}`, fontSize: 10 },
        {
          text: 'Dodatkowe informacje egzaminacyjne',
          style: 'subheader',
          margin: [0, 10, 0, 5],
        },
        {
          ul: this.additionalExamInformations,
          fontSize: 9,
        },
        {
          text: 'Organizacja kolejnego roku nauki',
          style: 'subheader',
          margin: [0, 10, 0, 5],
        },
        {
          text: 'Całoroczna praca ucznia, jego zaangażowanie i stopień opanowania materiału, wyniki testów bieżących oraz próbnych egzaminów diagnozujących są dla nas ważne i stanowią podstawę do kwalifikacji do grup o zbliżonych kompetencjach językowych w kolejnym roku szkolnym. Bierzemy też pod uwagę indywidualne zdolności oraz stopień motywacji ucznia w trakcie całego roku szkolnego.',
          style: 'margins',
          fontSize: 9,
        },
        { text: '\n', fontSize: 5 },
        {
          text: 'Staramy się maksymalnie wspierać potencjał językowy uczniów i łączyć dzieci według umiejętności. Gdy tylko jest to możliwe, tworzymy trzy rodzaje kursów:',
          style: 'margins',
          fontSize: 9,
        },
        { text: '\n', fontSize: 4 },
        {
          text: '1) BFT czyli BRITANNIA Fast Track – dla uczniów celujących i wzorowych, którzy mają wyniki od 90% wzwyż, wyróżniają się swobodą w komunikacji i aktywnie wykorzystują poznane treści, są otwarci i maksymalnie zaangażowani w naukę, regularnie i w szybszym tempie podchodzą do kolejnych egzaminów Cambridge. Często w tej grupie znajdują się dzieci, które w kolejnych latach startują w konkursach językowych lub wybierają dwujęzyczne profile w liceum. Grupy BFT zazwyczaj nie są grupami dowożonymi, są złożone z dzieci z różnych klas i szkół.',
          fontSize: 9,
        },
        { text: '\n', fontSize: 4 },
        {
          text: '2) BRT czyli BRITANNIA Regular Track – dla uczniów, którzy opanowali materiał bardzo dobrze i dobrze, są zawsze przygotowani, oraz chętni i zmotywowani, by posługiwać się angielskim i osiągać jak najlepsze rezultaty; zależy im, by jak najlepiej poznać angielski. Uczniowie z tej grupy zazwyczaj regularnie podchodzą do kolejnych egzaminów Cambridge.',
          fontSize: 9,
        },
        { text: '\n', fontSize: 4 },
        {
          text: '3) BST czyli BRITANNIA Support Track – dla uczniów osiągających wyniki poniżej 65% oraz tych, którzy potrzebują więcej wsparcia w opanowaniu materiału i z nieśmiałością podchodzą do aktywizacji mówienia i muszą bardziej otworzyć się na naukę.',
          fontSize: 9,
        },
        {
          text: `W przyszłym roku szkolnym rekomenduję naukę w trybie: ${form.value.learningRecommendations}`,
          margin: [0, 10],
          bold: true,
          fontSize: 10,
        },
        {
          text: `${recommendationsArray.length > 0 ? 'Rekomendacje' : ''}`,
          style: 'header',
        },
        { ul: recommendationsArray, fontSize: 10 },
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

    pdfMake.createPdf(docDefinition).open();
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
          [
            { text: 'Słuchanie', alignment: 'center', rowSpan: 3 },
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
            '',
            { text: `3`, alignment: 'center' },
            {
              text: `${
                form.value.listeningA1Array[2].date
                  ? new Date(
                      form.value.listeningA1Array[2].date
                    ).toLocaleDateString()
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA1Array[2].score
                  ? `${form.value.listeningA1Array[2].score}%`
                  : '-'
              }`,
              alignment: 'center',
            },
            {
              text: `${
                form.value.listeningA1Array[2].result
                  ? form.value.listeningA1Array[2].result
                  : '-'
              }`,
              alignment: 'center',
            },
          ],
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
          [
            { text: 'Słuchanie', alignment: 'center' },
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
            { text: 'Czytanie i Pisanie', alignment: 'center' },
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
            { text: 'Mówienie', alignment: 'center' },
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
        ],
      },
    };
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
      name: new FormControl(null, Validators.required),
      sex: new FormControl(null, Validators.required),
      date: new FormControl(null, Validators.required),
      class: new FormControl(null, Validators.required),
      teacher: new FormControl(null, Validators.required),
      studentBookTitle: new FormControl(null, Validators.required),
      course: new FormControl(null, Validators.required),
      realizedMaterial: new FormControl(null, Validators.required),

      marks: new FormControl(null, Validators.required),
      avgMark: new FormControl(null, Validators.required),
      frequency: new FormControl(null, Validators.required),
      lead: new FormControl(null, Validators.required),
      respect: new FormControl(null, Validators.required),
      focus: new FormControl(null, Validators.required),
      pronunciation: new FormControl(null, Validators.required),
      vocabulary: new FormControl(null, Validators.required),
      prepareToLecture: new FormControl(null, Validators.required),
      homeworks: new FormControl(null, Validators.required),
      involvement: new FormControl(null, Validators.required),
      behaviour: new FormControl(null, Validators.required),

      typeOfExam: new FormControl(null, Validators.required),

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

      examRecommendationAcceptCheckbox: new FormControl(false),
      examRecommendationNonCheckbox: new FormControl(false),
      examRecommendationResult: new FormControl(null),
      examRecommendation: new FormControl('', Validators.required),

      learningRecommendations: new FormControl(null),
      recommendations: new FormArray([]),

      signature: new FormControl(null, Validators.required),
    });
  }
}
