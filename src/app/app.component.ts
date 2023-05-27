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
  examsCount,
  examsRecommendations,
  examsSelect,
  kindOfCourses,
  learningRecommendations,
  resultOfExam,
} from './shared/exams';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title: string = 'britannia-reports';

  public form!: FormGroup;

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
  public readonly examsCount: string[] = examsCount;
  public readonly examsSelect: string[] = examsSelect;
  public selectedTypeOfExam: string = '';

  public readonly examsRecommendations: string[] = examsRecommendations;

  public isChecked: boolean = false;

  public learningRecommendations: string[] = learningRecommendations;

  private readonly additionalExamInformations: string[] =
    additionalExamInformations;
  private readonly kindOfCourses: string[] = kindOfCourses;

  ngOnInit(): void {
    this.form = this.createForm();

    this.createExamsFormArray();
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

  public generatePDF(form: FormGroup): any {
    console.log(form.value);

    let date: string = new Date(form.value.date).toLocaleDateString();

    let commentsArray: string[] = [];
    form.value.comments.forEach((comment: string) =>
      commentsArray.push(comment)
    );

    let recommendationsArray: string[] = [];
    form.value.comments.forEach((comment: string) =>
      recommendationsArray.push(comment)
    );

    const changeXToStudentName = (
      textValue: string,
      studentName: string
    ): string => {
      return textValue.replace(textValue[0], studentName);
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
            { text: `${form.value.studentName}`, style: 'header' },
          ],
          margin: 10,
        },
        {
          style: 'tableExample',
          table: {
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
            body: [
              [
                {
                  rowSpan: 12,
                  text: 'Nasza skala ocen',
                  style: 'tableHeader',
                },
                {
                  text: '100%+*',
                },
                {
                  text: '6',
                },
                {
                  rowSpan: 10,
                  text: 'Uzyskane oceny**',
                  style: 'tableHeader',
                },
                {
                  rowSpan: 10,
                  text: `${form.value.marks}`,
                  style: 'tableHeader',
                },
              ],
              [
                '',
                {
                  text: '96-100%',
                },
                {
                  text: '5',
                },
                '',
                '',
              ],
              [
                '',
                {
                  text: '90-95%',
                },
                {
                  text: '5-',
                },
                '',
                '',
              ],
              [
                '',
                {
                  text: '85-89%',
                },
                {
                  text: '4+',
                },
                '',
                '',
              ],
              [
                '',
                {
                  text: '80-84%',
                },
                {
                  text: '4',
                },
                '',
                '',
              ],
              [
                '',
                {
                  text: '75-79%',
                },
                {
                  text: '4-',
                },
                '',
                '',
              ],
              [
                '',
                {
                  text: '70-74%',
                },
                {
                  text: '3+',
                },
                '',
                '',
              ],
              [
                '',
                {
                  text: '64-69%',
                },
                {
                  text: '3',
                },
                '',
                '',
              ],
              [
                '',
                {
                  text: '60-63%',
                },
                {
                  text: '3-',
                },
                '',
                '',
              ],
              [
                '',
                {
                  text: '55-59%',
                },
                {
                  text: '2+',
                },
                '',
                '',
              ],
              [
                '',
                {
                  text: '45-54%',
                },
                {
                  text: '2',
                },
                {
                  text: 'Bieżące postępy',
                  style: 'tableHeader',
                },
                {
                  text: `${form.value.avgMark}`,
                },
              ],
              [
                '',
                {
                  text: '0-44%',
                },
                {
                  text: '1',
                },
                {
                  text: 'Frekwencja',
                  style: 'tableHeader',
                },
                {
                  text: `${form.value.frequency}`,
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
          fontSize: '10',
        },
        {
          text: '** Opis oceny można znaleźć w dzienniku EduSky',
          fontSize: '10',
        },
        {
          style: 'tableExample',
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'Zaangażowanie i udział w lekcjach' },
                { text: `${form.value.involvementInLessons}` },
              ],
              [
                { text: 'Prowadzenie zeszytu, notatek' },
                { text: `${form.value.lead}` },
              ],
              [
                { text: 'Szacunek do nauczyciela i innych kursantów z grupy' },
                { text: `${form.value.respect}` },
              ],
              [
                { text: 'Skupienie uwagi na lekcjach' },
                { text: `${form.value.focus}` },
              ],
            ],
          },
        },
        {
          style: 'marksTable',
          table: {
            widths: ['auto', '*', 'auto'],
            body: [
              [
                { text: 'Wymowa' },
                {
                  text: `${changeXToStudentName(
                    form.value.pronunciation,
                    form.value.studentName
                  )}`,
                },
                {
                  text: `${getMarkValue(
                    form.value.pronunciation,
                    pronunciationMarks
                  )}`,
                },
              ],
              [
                { text: 'Słownictwo' },
                {
                  text: `${changeXToStudentName(
                    form.value.vocabulary,
                    form.value.studentName
                  )}`,
                },
                {
                  text: `${getMarkValue(
                    form.value.vocabulary,
                    vocabularyMarks
                  )}`,
                },
              ],
              [
                { text: 'Przygotowanie do zajęć' },
                {
                  text: `${changeXToStudentName(
                    form.value.prepareToLecture,
                    form.value.studentName
                  )}`,
                },
                {
                  text: `${getMarkValue(
                    form.value.prepareToLecture,
                    prepareToLectureMarks
                  )}`,
                },
              ],
              [
                { text: 'Prace domowe' },
                {
                  text: `${changeXToStudentName(
                    form.value.homeworks,
                    form.value.studentName
                  )}`,
                },
                {
                  text: `${getMarkValue(form.value.homeworks, homeworksMarks)}`,
                },
              ],
              [
                { text: 'Zaangażowanie' },
                {
                  text: `${changeXToStudentName(
                    form.value.involvement,
                    form.value.studentName
                  )}`,
                },
                {
                  text: `${getMarkValue(
                    form.value.involvement,
                    involvementMarks
                  )}`,
                },
              ],
              [
                { text: 'Zachowanie' },
                {
                  text: `${changeXToStudentName(
                    form.value.behaviour,
                    form.value.studentName
                  )}`,
                },
                {
                  text: `${getMarkValue(form.value.behaviour, behaviourMarks)}`,
                },
              ],
            ],
          },
        },
        {
          text: 'Poziom biegłości',
          style: 'header',
        },
        {
          text:
            'Zależy nam na tym, by jak najwcześniej diagnozować poziom umiejętności dzieci, by jak najszybciej łączyć je w grupy według poziomu ich umiejętności, by mogły rozwijać się językowo w swoim tempie i jak najpełniej korzystać z lekcji. Jak co roku na wiosnę została przeprowadzona diagnoza poziomu języka naszych uczniów według Europejskiego Systemu Kształcenia Językowego z wykorzystaniem próbnych egzaminów Cambridge. W klasie 4 oczekiwany poziom umiejętności to wejście na poziom A1, co testujemy drugim egzaminem dla dzieci: Cambridge Movers.\n' +
            '\n' +
            'Testy Cambridge dla dzieci to testy przekrojowe, diagnostyczne - nie można ich nie zdać, mają wskazać poziom biegłości językowej. Ważne są procenty. Uznajemy, że dziecko wskoczyło na dany poziom biegłości uzyskując minimum 60%. Jednak by stwierdzić, że dziecko faktycznie osiągnęło dany poziom językowy i może przystąpić do oficjalnego egzaminu Cambridge powinno osiągnąć min. 80% z testów próbnych. Uczniowie zazwyczaj przystępują do oficjalnego testu Movers w klasie 5. Na testach próbnych diagnozujemy umiejętności Słuchania oraz Czytania i Pisania. Na egzaminie jest też Mówienie, co ćwiczymy i sprawdzamy na bieżąco.',
        },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            body: [
              [
                {
                  text: `Rodzaj egzaminu`,
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
                  text: 'Umiejętność',
                  style: 'tableHeader',
                  alignment: 'center',
                },
                {
                  text: 'Uzyskany wynik w %',
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
                { text: `${form.value.typeOfExam}`, alignment: 'center' },
                { text: `1`, alignment: 'center' },
                {
                  text: `${new Date(
                    form.value.listeningA1Array[0].date
                  ).toLocaleDateString()}`,
                  alignment: 'center',
                },
                {
                  text: 'Słuchanie',
                  alignment: 'center',
                },
                {
                  text: `${form.value.listeningA1Array[0].score}%`,
                  alignment: 'center',
                },
                {
                  text: `${form.value.listeningA1Array[0].result}`,
                  alignment: 'center',
                },
              ],
            ],
          },
        },
        { text: 'Komentarz', style: 'header' },
        {
          ul: commentsArray,
        },
        { text: 'Rekomendacja egzaminacyjna', style: 'header' },
        { text: `${form.value.examRecommendation}` },
        { text: 'Dodatkowe informacje egzaminacyjne', style: 'header' },
        { ul: this.additionalExamInformations },
        { text: 'Organizacja kolejnego roku nauki', style: 'header' },
        'Całoroczna praca ucznia, jego zaangażowanie i stopień opanowania materiału, wyniki testów bieżących oraz próbnych egzaminów diagnozujących są dla nas ważne i stanowią podstawę do kwalifikacji do grup o zbliżonych kompetencjach językowych w kolejnym roku szkolnym. Bierzemy też pod uwagę indywidualne zdolności oraz stopień motywacji ucznia w trakcie całego roku szkolnego.',
        'Staramy się maksymalnie wspierać potencjał językowy uczniów i łączyć dzieci według umiejętności. Gdy tylko jest to możliwe, tworzymy trzy rodzaje kursów',
        { ol: this.kindOfCourses },
        { text: 'Rekomendacje', style: 'header' },
        { ul: recommendationsArray },
        { text: form.value.signature },
      ],
      styles: {
        tableHeader: {
          fontSize: 12,
          bold: true,
        },
        tableExample: {
          margin: [0, 15, 0, 5],
        },
        marksTable: {
          margin: [0, 15, 0, 15],
        },
        header: {
          bold: true,
          fontSize: 15,
        },
        title: {
          fontSize: 16,
          bold: true,
          alignment: 'justify',
          decoration: 'underline',
        },
        defaultStyle: {
          fontSize: 12,
        },
      },
    };

    pdfMake.createPdf(docDefinition).open();
  }

  private createExamsFormArray(): void {
    this.resultOfExam.forEach((exam) => {
      this.listeningA1Array.push(
        new FormGroup({
          date: new FormControl(null),
          score: new FormControl(null),
          result: new FormControl(null),
        })
      );

      this.writingAndReadingA1Array.push(
        new FormGroup({
          date: new FormControl(null),
          score: new FormControl(null),
          result: new FormControl(null),
        })
      );

      this.speakingA1Array.push(
        new FormGroup({
          date: new FormControl(null),
          score: new FormControl(null),
          result: new FormControl(null),
        })
      );

      this.listeningA2B1Array.push(
        new FormGroup({
          date: new FormControl(null),
          score: new FormControl(null),
          result: new FormControl(null),
        })
      );

      this.readingA2B1Array.push(
        new FormGroup({
          date: new FormControl(null),
          score: new FormControl(null),
          result: new FormControl(null),
        })
      );

      this.writingA2B1Array.push(
        new FormGroup({
          date: new FormControl(null),
          score: new FormControl(null),
          result: new FormControl(null),
        })
      );

      this.speakingA2B1Array.push(
        new FormGroup({
          date: new FormControl(null),
          score: new FormControl(null),
          result: new FormControl(null),
        })
      );

      this.listeningB2C1Array.push(
        new FormGroup({
          date: new FormControl(null),
          score: new FormControl(null),
          result: new FormControl(null),
        })
      );

      this.readingB2C1Array.push(
        new FormGroup({
          date: new FormControl(null),
          score: new FormControl(null),
          result: new FormControl(null),
        })
      );

      this.useOfEnglishB2C1Array.push(
        new FormGroup({
          date: new FormControl(null),
          score: new FormControl(null),
          result: new FormControl(null),
        })
      );

      this.writingB2C1Array.push(
        new FormGroup({
          date: new FormControl(null),
          score: new FormControl(null),
          result: new FormControl(null),
        })
      );

      this.speakingB2C1Array.push(
        new FormGroup({
          date: new FormControl(null),
          score: new FormControl(null),
          result: new FormControl(null),
        })
      );
    });
  }

  private createForm(): FormGroup {
    return new FormGroup({
      studentName: new FormControl(null, Validators.required),
      date: new FormControl(null, Validators.required),
      class: new FormControl(null, Validators.required),
      teacher: new FormControl(null, Validators.required),
      studentBookTitle: new FormControl(null, Validators.required),
      course: new FormControl(null, Validators.required),
      realizedMaterial: new FormControl(null, Validators.required),

      marks: new FormControl(null, Validators.required),
      avgMark: new FormControl(null, Validators.required),
      frequency: new FormControl(null, Validators.required),
      involvementInLessons: new FormControl(null, Validators.required),
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

      examRecommendationCheckbox: new FormControl(false),
      examRecommendationResult: new FormControl(null),
      examRecommendation: new FormControl(null, Validators.required),

      learningRecommendations: new FormControl(null),
      recommendations: new FormArray([]),

      signature: new FormControl(null, Validators.required),
    });
  }
}
