import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ELEMENT_DATA, TableElement } from '../rating-scale/table-elements';
import { classes, teachers, books, courses } from '../shared/select-values';
import {
  behaviourMarks,
  frequencyMarks,
  homeworksMarks,
  involvementMarks,
  Marks,
  marks,
  prepareToLectureMarks,
  pronunciationMarks,
  vocabularyMarks,
} from '../shared/marks';
import { learningRecommendations } from '../shared/exams';
import { image } from '../shared/images-base64';
import { TranslateService } from '@ngx-translate/core';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-semestr-report',
  templateUrl: './semestr-report.component.html',
  styleUrls: ['./semestr-report.component.scss'],
})
export class SemestrReportComponent implements OnInit {
  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('pl');
  }
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
  public readonly frequencyMarks: Marks[] = frequencyMarks;

  public isCheckedBook: boolean = false;
  public isCheckedOwnTitle: boolean = false;

  public learningRecommendations: string[] = learningRecommendations;

  private readonly imageLogo: string = image;

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

  public onCheckboxChangeBook(): void {
    this.isCheckedBook = true;
    this.isCheckedOwnTitle = false;
    this.form.get('ownEducationMaterial')?.setValue(false);
    this.form.get('ownTitleStudentBook')?.setValue(null);
  }

  public onCheckboxChangeOwnTitle(): void {
    this.isCheckedOwnTitle = true;
    this.isCheckedBook = false;
    this.form.get('ownEducationMaterial')?.setValue(false);
    this.form.get('studentBookTitle')?.setValue(null);
  }

  public onCheckboxChangeOwnMaterialEducation(): void {
    this.isCheckedOwnTitle = false;
    this.isCheckedBook = false;
    this.form.get('ownEducationMaterial')?.setValue(true);
    this.form.get('studentBookTitle')?.setValue(null);
    this.form.get('ownTitleStudentBook')?.setValue(null);
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

    let docDefinition = {
      content: [
        {
          text: 'PODSUMOWANIE NAUKI I REKOMENDACJE',
          style: 'title',
          alignment: 'center',
        },
        {
          text: 'Raport semestralny',
          style: 'subheader',
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
                {
                  text: `${
                    form.value.studentBookTitle
                      ? form.value.studentBookTitle
                      : form.value.ownTitleStudentBook
                      ? form.value.ownTitleStudentBook
                      : 'Własne materiały szkoleniowe'
                  }`,
                },
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
                  fontSize: 7,
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
                  fontSize: 7,
                },
                {
                  text: '6*',
                  fontSize: 7,
                },
                {
                  text: '',
                  rowSpan: 12,
                },
                {
                  colSpan: 2,
                  rowSpan: 11,
                  text: 'Szczegółowe zestawienie ocen oraz ich opis znajdują się w dzienniku elektronicznym EduSky.',
                  style: 'tableHeader',
                },
                {},
              ],
              [
                {
                  text: '96-100%',
                  fontSize: 7,
                },
                {
                  text: '5',
                  fontSize: 7,
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '90-95%',
                  fontSize: 7,
                },
                {
                  text: '5-',
                  fontSize: 7,
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '85-89%',
                  fontSize: 7,
                },
                {
                  text: '4+',
                  fontSize: 7,
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '80-84%',
                  fontSize: 7,
                },
                {
                  text: '4',
                  fontSize: 7,
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '75-79%',
                  fontSize: 7,
                },
                {
                  text: '4-',
                  fontSize: 7,
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '70-74%',
                  fontSize: 7,
                },
                {
                  text: '3+',
                  fontSize: 7,
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '64-69%',
                  fontSize: 7,
                },
                {
                  text: '3',
                  fontSize: 7,
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '60-63%',
                  fontSize: 7,
                },
                {
                  text: '3-',
                  fontSize: 7,
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '55-59%',
                  fontSize: 7,
                },
                {
                  text: '2+',
                  fontSize: 7,
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '45-54%',
                  fontSize: 7,
                },
                {
                  text: '2',
                  fontSize: 7,
                },
                '',
                '',
                '',
              ],
              [
                {
                  text: '0-44%',
                  fontSize: 7,
                },
                {
                  text: '1',
                  fontSize: 7,
                },
                '',
                {
                  text: 'Ocena semestralna',
                  style: 'tableHeader',
                },
                {
                  text: `${form.value.avgMark ? form.value.avgMark : '-'}`,
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
        {
          style: 'tableExams',
          table: {
            widths: ['auto', '*'],
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
              ],
              [
                { text: 'Wymowa' },
                {
                  text: `${changeXToStudentName(
                    form.value.pronunciation,
                    form.value.name
                  )}`,
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
              ],
              [
                { text: 'Przygotowanie do zajęć' },
                {
                  text: `${changeXToEmptyValue(form.value.prepareToLecture)}`,
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
              ],
              [
                { text: 'Zaangażowanie' },
                {
                  text: `${changeXToStudentName(
                    form.value.involvement,
                    form.value.name
                  )}`,
                },
              ],
              [
                { text: 'Zachowanie' },
                {
                  text: `${changeXToEmptyValue(form.value.behaviour)}`,
                },
              ],
              [
                { text: 'Frekwencja' },
                {
                  text: `${form.value.frequency}`,
                },
              ],
            ],
          },
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
      form.value.studentName.split(' ').join('-') + '_semester_report';
    pdfMake.createPdf(docDefinition).download(fileName);
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
      pronunciation: new FormControl(null, Validators.required),
      vocabulary: new FormControl(null, Validators.required),
      prepareToLecture: new FormControl(null, Validators.required),
      homeworks: new FormControl(null, Validators.required),
      involvement: new FormControl(null, Validators.required),
      behaviour: new FormControl(null, Validators.required),

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

      examRecommendationAcceptCheckbox: new FormControl(false),
      examRecommendationNonCheckbox: new FormControl(false),
      examRecommendationResult: new FormControl(null),
      examRecommendation: new FormControl(''),

      learningRecommendations: new FormControl(null),
      recommendations: new FormArray([]),

      signature: new FormControl(null),
    });
  }
}
