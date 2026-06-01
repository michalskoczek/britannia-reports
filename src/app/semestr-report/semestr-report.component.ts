import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// @ts-expect-error pdfMake
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-expect-error pdfFonts
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ELEMENT_DATA, TableElement } from '../rating-scale/table-elements';
import { sexes, classes, teachers, books, courses } from '../shared/select-values';
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
import { additionalExamInformations, examsRecommendations, learningRecommendations } from '../shared/exams';
import { image } from '../shared/images-base64';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReportType } from '../shared/enum/report-type.enum';
import { Sex } from '../shared/enum/sex.enum';
import { MatError, MatFormField, MatHint, MatInput, MatLabel } from '@angular/material/input';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';

import { MatOption, MatSelect } from '@angular/material/select';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatButton } from '@angular/material/button';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { MatCheckbox } from '@angular/material/checkbox';

pdfMake.vfs = pdfFonts.vfs;

@Component({
  selector: 'app-semestr-report',
  templateUrl: './semestr-report.component.html',
  styleUrls: ['./semestr-report.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    TranslateModule,
    MatError,
    MatDatepickerInput,
    MatHint,
    MatDatepickerToggle,
    MatInput,
    MatDatepicker,
    MatSelect,
    MatOption,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatRadioGroup,
    MatRadioButton,
    MatButton,
    MatTable,
    MatColumnDef,
    MatCell,
    MatHeaderCell,
    MatHeaderRow,
    MatRow,
    MatCheckbox,
    MatHeaderCellDef,
    MatCellDef,
    MatHeaderRowDef,
    MatRowDef,
  ],
})
export class SemestrReportComponent implements OnInit {
  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('pl');
  }
  title = 'britannia-reports';

  public form!: FormGroup;

  public readonly sexes: string[] = sexes;
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

  public isCheckedBook = false;
  public isCheckedOwnTitle = false;

  public learningRecommendations: string[] = learningRecommendations;

  public isChecked = false;

  private readonly imageLogo: string = image;
  private readonly semesterText: string = 'semestralny';
  private readonly trimesterText: string = '(trymestr 1.)';
  private readonly trimesterTextTitle: string = 'po pierwszym trymestrze';
  private readonly semesterTextMark: string = 'semestralna';

  public readonly additionalExamInformations: string[] = additionalExamInformations;

  public readonly addExamInfoCambridge: string[] = [...additionalExamInformations];

  private readonly checkmarkLogo: string =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAv5JREFUaEPtmDmrFEEUhb8Hboio4C4q4gauKGaCkRsGgmjimoggLoFiZmAomIhooGIgZiIugQgKLmiouP0C/4Br7NrnUSXz+k1P3dvT7fTAVDYzp6rOuffUrVszRJ+PoT7nz0BArzM4yMAgA+kITAfuAeuAE8DN1ilNt9AM4EkmYE0g/Qc4BlyNIposQOSfAqtzSZKIo8A1fd9UAUXko5bfwCHZqYkCZobIr0ocj1/AwaYJEPlnwMr02R5GfGqSgFmB/AojecGeN0WA1Tat2j4Am5sgwGsbiRgm3wQLyTYqlVbPjyDf6zJaxvP/It/ri6wS8kUZWAScAz4CZ4Efjqpggc5V9QCWWcAB8z54/nN+Tv4QrwceAoqQxl1gD/DTsVkn6OzgeU+pHGWbomZuU+j6JucY3AH2ViBC5HVJLXcEQ5HfompTNCdmYD9wAxhbALwN7AN0fZcZ84JtljgmF9omn4HjwGVDYyeBh7NzoUbKM8qQfxc8/yW1kTLwHcjbpmjedeAIoJbWMuaHyC+2gAPGTF54CbgP7HRscAVQ1lIiFgTPe8i/DZ5PRj7ylYCJwKOsOmx0iLgEnOwgokzkTZ7Pc4yHeEoobyqj1nExs9+pNuAykS9FPlooctDj+QXgqdEXgNMtIkRel5QuQ+soTT4vQJ91S74EPL49D5wBlgYrLrQyB94Ez391zBkBbddOi4BEyMfW8Q2YBIyxTqiCfLsMxP0VTdlpjoOQB6pSqRt2VG/jWaSTAP2mvzPk52neRRN4V51P7Z16ka0NIqamFjL+Xin5VAYipw3A4+BxI8+2sMrJWwUIp/fnA2BCSQXuG9a6T8pCrevsANRaj7MuHnCvga3Zza1KVfnwCNDm20PvNN7IpLbIx/29AjRPjZ/eB0Vvh7j2K2BbXZHvRoDm7gJudRBRe+S7FdBJxH8j76lCRZbfHTIRWwj1Njqw5n7eeJYKYWXOQH4x2Umttf49OBBeeN3yMs+vQoB5szqAAwF1RNWz5iADnmjVge37DPwFRASGR52JQuMAAAAASUVORK5CYII=';

  private readonly emptyImageLogo: string =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABICAIAAAD51HXFAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACOSURBVHhe7dAxAQAwEAOh+jedrn8eQAJvHDpCR+gIHaEjdISO0BE6QkfoCB2hI3SEjtAROkJH6AgdoSN0hI7QETpCR+gIHaEjdISO0BE6QkfoCB2hI3SEjtAROkJH6AgdoSN0hI7QETpCR+gIHaEjdISO0BE6QkfoCB2hI3SEjtAROkJH6AgdoSN0hI5j+48/qHbII7vkAAAAAElFTkSuQmCC';

  protected readonly ReportType = ReportType;
  protected readonly Sex = Sex;
  protected readonly examsRecommendations = examsRecommendations;

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

  public onCheckboxChange(): void {
    this.isChecked = !this.isChecked;
  }

  public onCheckboxChangeRecommendation(): void {
    this.isChecked = false;
    this.form.get('examRecommendationResult')?.setValue(null);
  }

  public generatePDF(form: FormGroup): any {
    const date: string = new Date(form.value.date).toLocaleDateString();

    const commentsArray: string[] = [];
    form.value.comments.forEach((comment: string) => commentsArray.push(comment));

    const recommendationsArray: string[] = [];
    form.value.recommendations.forEach((comment: string) => recommendationsArray.push(comment));

    const changeXToStudentName = (textValue: string, studentName: string): string => {
      return textValue.replace(textValue[0], studentName);
    };

    const changeXToYValue = (textValue: string, yValue: string): string => {
      return textValue.replace(textValue[0], yValue);
    };

    const changeXToEmptyValue = (textValue: string): string => {
      return textValue.replace(/^X\s+(\w)/, (match, firstLetter) => firstLetter.toUpperCase());
    };

    const addSpaceAfterTeacher = (teachers: string[]) => {
      if (!teachers) return;

      return teachers.join(', ');
    };

    const getMarkValue = (selectedValue: string, marks: Marks[]): string | undefined => {
      const markObj: Marks | undefined = marks.find((mark: Marks): boolean => mark.value === selectedValue);
      return markObj?.viewValue[0];
    };

    const docDefinition = {
      content: [
        {
          text: 'PODSUMOWANIE NAUKI I REKOMENDACJE',
          style: 'title',
          alignment: 'left',
        },
        {
          columns: [
            {
              stack: [
                {
                  text: `Raport ${
                    form.get('reportType')?.value === ReportType.SEMESTER ? this.semesterText : this.trimesterTextTitle
                  }`,
                  style: 'subheader',
                },
                {
                  text: [`Imię i Nazwisko ucznia: `, { text: `${form.value.studentName}`, style: 'subtitle' }],
                  margin: [0, 5, 0, 0],
                  style: 'subheader',
                },
              ],
              width: '*',
            },
            {
              image: this.imageLogo,
              width: 75,
              height: 55,
              alignment: 'right',
              margin: [0, -20, 0, 0],
            },
          ],
          columnGap: 10,
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
                { text: `${addSpaceAfterTeacher(form.value.teachers)}` },
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
          style: 'tableMarginTopBottom',
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
                  text: `${changeXToStudentName(form.value.pronunciation, form.value.name)}`,
                },
              ],
              [
                { text: 'Słownictwo' },
                {
                  text: `${changeXToYValue(
                    form.value.vocabulary,
                    form.value.sex === Sex.MALE ? 'Uczeń' : 'Uczennica'
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
                  text: `${changeXToYValue(form.value.homeworks, form.value.sex === Sex.MALE ? 'Uczeń' : 'Uczennica')}`,
                },
              ],
              [
                { text: 'Zaangażowanie' },
                {
                  text: `${changeXToStudentName(form.value.involvement, form.value.name)}`,
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
          style: 'tableExample',
          table: {
            widths: [
              '20%',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
            ],
            body: [
              [
                { text: 'Uzyskane oceny' },
                {
                  text: 'Szczegółowe zestawienie ocen oraz ich opis znajdują się w dzienniku elektronicznym EduSky.',
                  colSpan: 12,
                },
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
              ],
              [
                {
                  text: `Ocena ${
                    form.value.reportType === ReportType.SEMESTER ? this.semesterTextMark : this.trimesterText
                  }`,
                },
                {
                  text: `${form.value.avgMark ? form.value.avgMark : '-'}`,
                  alignment: 'left',
                  colSpan: 12,
                },
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
              ],
              [
                { text: 'Nasza skala ocen', rowSpan: 2, alignment: 'left' },
                { text: '100%+', alignment: 'left', fontSize: 8 },
                { text: '96-100%', alignment: 'center', fontSize: 8 },
                { text: '90-95%', alignment: 'center', fontSize: 8 },
                { text: '85-89%', alignment: 'center', fontSize: 8 },
                { text: '80-84%', alignment: 'center', fontSize: 8 },
                { text: '75-79%', alignment: 'center', fontSize: 8 },
                { text: '70-74%', alignment: 'center', fontSize: 8 },
                { text: '64-69%', alignment: 'center', fontSize: 8 },
                { text: '60-63%', alignment: 'center', fontSize: 8 },
                { text: '51-63%', alignment: 'center', fontSize: 8 },
                { text: '45-54%', alignment: 'center', fontSize: 8 },
                { text: '0-44%', alignment: 'center', fontSize: 8 },
              ],
              [
                {},
                { text: '6*', alignment: 'center', fontSize: 8 },
                { text: '5', alignment: 'center', fontSize: 8 },
                { text: '5-', alignment: 'center', fontSize: 8 },
                { text: '4+', alignment: 'center', fontSize: 8 },
                { text: '4', alignment: 'center', fontSize: 8 },
                { text: '4-', alignment: 'center', fontSize: 8 },
                { text: '3+', alignment: 'center', fontSize: 8 },
                { text: '3', alignment: 'center', fontSize: 8 },
                { text: '3-', alignment: 'center', fontSize: 8 },
                { text: '2+', alignment: 'center', fontSize: 8 },
                { text: '2', alignment: 'center', fontSize: 8 },
                { text: '1', alignment: 'center', fontSize: 8 },
              ],
            ],
          },
        },
        {
          text: '* Ocena celująca przyznawana jest za osiągnięcia specjalne, w szczególności za wyróżniające się odpowiedzi ustne lub pisemne.',
          fontSize: 7,
        },
        this.additionalComment(form),
        this.recommendationExamTitle(form),
        this.examRecommendationToCambridge(form),
        {
          text: 'Międzynarodowe egzaminy Cambridge w Britannii – informacje',
          style: 'header',
          margin: [0, 5, 0, 2],
        },
        {
          ul: this.additionalExamInformations,
          fontSize: 9,
          margin: [0, 0, 0, 0],
        },
        {
          text: form.value.signature,
          margin: [0, 5, 0, 0],
          fontSize: 10,
          alignment: 'right',
        },
      ],
      styles: {
        tableHeader: {
          fontSize: 9,
          bold: true,
        },
        tableExample: {
          margin: [0, 5, 0, 2],
          fontSize: 9,
        },
        tableExams: {
          margin: [0, 0, 0, 5],
          fontSize: 9,
        },
        tableMarginTopBottom: {
          margin: [0, 5, 0, 5],
          fontSize: 9,
        },
        marksTable: {
          margin: [0, 5, 0, 5],
          fontSize: 8,
        },
        header: {
          bold: true,
          fontSize: 10,
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
          fontSize: 12,
          alignment: 'justify',
          bold: true,
        },
        defaultStyle: {
          fontSize: 10,
        },
        recommendation: {
          fontSize: 11,
          bold: true,
          margin: [0, 10, 0, 10],
        },
      },
    };

    const fileName: string = form.value.studentName.split(' ').join('-') + '_semester_report';
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  private additionalComment(form: FormGroup): any {
    if (form.getRawValue().additionalComment) {
      return {
        style: 'tableExample',
        table: {
          widths: ['auto', '*'],
          margin: [0, 5, 0, 0],
          body: [
            [
              { text: 'Informacje dodatkowe' },
              {
                text: `${form.value.additionalComment}`,
              },
            ],
          ],
        },
      };
    } else {
      return {};
    }
  }

  private recommendationToExamCambridge(form: FormGroup): any {
    if (form.getRawValue().recommendationToCambridgeExam) {
      return {
        text: 'Na podstawie grudniowej sesji egzaminacyjno-diagnostycznej wystawiamy wstępną rekomendację do podejścia do egzaminu Cambridge na koniec roku szkolnego.',
        style: 'recommendation',
      };
    } else {
      return {};
    }
  }

  private recommendationExamTitle(form: FormGroup): any {
    if (form.getRawValue().isExamRecommendation) {
      return {
        text: 'REKOMENDACJA EGZAMINACYJNA',
        fontSize: 10,
        bold: true,
        margin: [0, 5, 0, 2],
      };
    } else {
      return {};
    }
  }

  private examRecommendationToCambridge(form: FormGroup): any {
    if (form.getRawValue().isExamRecommendation) {
      return {
        margin: [0, 0, 0, 5],
        fontSize: 9,
        table: {
          widths: ['auto', '*'],
          body: [
            [
              {
                text: 'Rekomendacje egzaminacyjne zostaną przekazane po kolejnym próbnym teście Cambridge.',
              },
              {
                image: `${form.value.examRecommendationOptions === '1' ? this.checkmarkLogo : this.emptyImageLogo}`,
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
                image: `${form.value.examRecommendationOptions === '2' ? this.checkmarkLogo : this.emptyImageLogo}`,
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
                image: `${form.value.examRecommendationOptions === '3' ? this.checkmarkLogo : this.emptyImageLogo}`,
                width: 15,
                height: 15,
                alignment: 'center',
              },
            ],
          ],
        },
      };
    } else {
      return {};
    }
  }

  private createForm(): FormGroup {
    return new FormGroup({
      reportType: new FormControl(ReportType.TRIMESTER, Validators.required),
      studentName: new FormControl(null, Validators.required),
      name: new FormControl(null),
      sex: new FormControl(null, Validators.required),
      date: new FormControl(null),
      class: new FormControl(null),
      teachers: new FormControl(null),
      studentBookTitle: new FormControl(null),
      ownTitleStudentBook: new FormControl(null),
      ownEducationMaterial: new FormControl(false),
      course: new FormControl(null),
      realizedMaterial: new FormControl(null),

      avgMark: new FormControl(null),
      recommendationToCambridgeExam: new FormControl(null),
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

      additionalComment: new FormControl(null),

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

      isExamRecommendation: new FormControl(false),
      examRecommendationAcceptCheckbox: new FormControl(false),
      examRecommendationNonCheckbox: new FormControl(false),
      examRecommendationResult: new FormControl(null),
      examRecommendation: new FormControl(''),
      examRecommendationOptions: new FormControl(null),

      learningRecommendations: new FormControl(null),
      recommendations: new FormArray([]),

      signature: new FormControl(null),
    });
  }
}
