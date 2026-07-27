import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// @ts-expect-error pdfmake
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-expect-error pdfFonts
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
import { GenerateTableA1 } from '../helper/cambridge/static-function/generate-table-A1';
import { GenerateTableA2B1 } from '../helper/cambridge/static-function/generate-table-A2-B1';
import { GenerateTableB2C1 } from '../helper/cambridge/static-function/generate-table-B2-C1';
import { ExamTypes } from '../shared/enum/exam-type.enum';
import { MatError, MatFormField, MatHint, MatInput, MatLabel } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
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

pdfMake.vfs = pdfFonts.vfs;

@Component({
  selector: 'app-cambridge-report',
  templateUrl: './cambridge-report.component.html',
  styleUrls: ['./cambridge-report.component.scss'],
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
  ],
})
export class CambridgeReportComponent implements OnInit {
  private cd = inject(ChangeDetectorRef);
  title = 'britannia-reports';

  public form!: FormGroup;

  public readonly classes: { label: string; value: string }[] = classes;
  public readonly teachers: string[] = teachers;
  public readonly courses: string[] = courses;
  public readonly marks: Marks[] = marks;

  public readonly resultOfExam: string[] = resultOfExam;
  public readonly examsSelect: string[] = examsSelect;
  public selectedTypeOfExam = '';

  public readonly examsRecommendations: string[] = examsRecommendations;

  public isChecked = false;

  public learningRecommendations: string[] = learningRecommendations;

  private readonly additionalExamInformations: string[] = additionalExamInformations;
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
    this.cd.detectChanges();
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
    const control = this.form.controls[nameOfArray] as FormArray;
    control.removeAt(index);
  }

  public generatePDF(form: FormGroup): void {
    const date: string = new Date(form.value.date).toLocaleDateString('pl-PL');

    const commentsArray: string[] = [];
    form.value.comments.forEach((comment: string) => commentsArray.push(comment));

    const recommendationsArray: string[] = [];
    form.value.recommendations.forEach((comment: string) => recommendationsArray.push(comment));

    const getMaxTerms = (...arrays: any[][]): number => Math.max(0, ...arrays.map((a) => a.length));

    const chooseTableOfExam = () => {
      const v = form.value;

      if (
        v.typeOfExam === ExamTypes.STARTERS ||
        v.typeOfExam === ExamTypes.MOVERS ||
        v.typeOfExam === ExamTypes.FLYERS
      ) {
        const maxTerms = getMaxTerms(v.listeningA1Array, v.writingAndReadingA1Array, v.speakingA1Array);

        if (maxTerms === 0) return [];

        return GenerateTableA1.generateTable(form, maxTerms);
      }

      if (v.typeOfExam === ExamTypes.A2_KEY || v.typeOfExam === ExamTypes.B1_PRELIMINARY) {
        const maxTerms = getMaxTerms(v.listeningA2B1Array, v.readingA2B1Array, v.writingA2B1Array, v.speakingA2B1Array);

        if (maxTerms === 0) return [];

        return GenerateTableA2B1.generateTable(form, maxTerms);
      }

      if (v.typeOfExam === ExamTypes.B2_FIRST || v.typeOfExam === ExamTypes.C1_ADVANCED) {
        const maxTerms = getMaxTerms(
          v.listeningB2C1Array,
          v.readingB2C1Array,
          v.useOfEnglishB2C1Array,
          v.writingB2C1Array,
          v.speakingB2C1Array
        );

        if (maxTerms === 0) return [];

        return GenerateTableB2C1.generateTable(form, maxTerms);
      }

      return [];
    };

    const addSpaceAfterTeacher = (teachers: string[]) => {
      if (!teachers) return;

      return teachers.join(', ');
    };

    const docDefinition: any = {
      content: [
        {
          text: 'RAPORT Z PRZEPROWADZENIA PRÓBNEGO EGZAMINU CAMBRIDGE',
          style: 'title',
          alignment: 'left',
        },
        {
          columns: [
            {
              stack: [
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
                { text: `${form.value.class ? form.value.class : undefined}` },
              ],
              [
                { text: 'Lektor', style: 'tableHeader' },
                { text: `${addSpaceAfterTeacher(form.value.teachers)}` },
                { text: 'Kurs', style: 'tableHeader' },
                {
                  text: `${form.value.course ? form.value.course : undefined}`,
                },
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
        this.commentAfterExaResults(form),
        {
          text: 'REKOMENDACJA EGZAMINACYJNA',
          style: 'header',
          margin: [0, 5, 0, 2],
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
        },
        {
          text: 'Dodatkowe informacje egzaminacyjne',
          style: 'header',
          margin: [0, 5, 0, 5],
        },
        {
          ul: this.additionalExamInformations,
          fontSize: 9,
        },
        {
          text: form.value.signature,
          margin: [0, 10, 0, 0],
          fontSize: 10,
          alignment: 'right',
        },
      ],
      styles: {
        tableHeader: {
          fontSize: 10,
          bold: true,
        },
        tableExample: {
          margin: [0, 5, 0, 2],
          fontSize: 10,
        },
        tableExams: {
          margin: [0, 10, 0, 10],
          fontSize: 10,
        },
        marksTable: {
          margin: [0, 5, 0, 5],
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

    const fileName: string = form.value.studentName.split(' ').join('-') + '_cambridge_report';
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  private commentAfterExaResults(form: FormGroup): any {
    const commentsArray: string[] = [];
    form.value.comments.forEach((comment: string) => commentsArray.push(comment));

    if (form.getRawValue().comments.length > 0) {
      return {
        text: `Komentarz: ${commentsArray.join(' ')}`,
        style: 'defaultStyle',
      };
    } else {
      return {};
    }
  }

  private createForm(): FormGroup {
    return new FormGroup({
      studentName: new FormControl(null, Validators.required),
      name: new FormControl(null),
      sex: new FormControl(null),
      date: new FormControl(null),
      class: new FormControl(null),
      teachers: new FormControl(null),
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
