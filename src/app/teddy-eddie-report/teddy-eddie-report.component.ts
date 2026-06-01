import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
// @ts-expect-error pdfmake
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-expect-error pdfFont
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { image } from '../shared/images-base64';
import { baner } from '../shared/baner-base64';
import {
  ageTE,
  booksToChoosingTE,
  certificationPurpose,
  courseLevelTE,
  coursesTE,
  languageLevels,
  schoolExamsTE,
  schoolYears,
  studentsAgeTE,
} from '../shared/development-path';
import { DevelopmentPathInSchool } from '../model/development-path-in-school';
import { DevelopmentPathTeddyEddie } from '../model/development-path-teddy-eddie';
import { TeddyEddieFormComponent } from './teddy-eddie-form/teddy-eddie-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../shared/components/button/button.component';
import { SectionTitleComponent } from '../shared/components/UI/section-title/section-title.component';
import { TeddyEddieTableComponent } from './tables/teddy-eddie-table/teddy-eddie-table.component';
import { CambridgePathTableComponent } from './tables/cambridge-path-table/cambridge-path-table.component';
import { FormWrapperComponent } from '../shared/components/form/form-wrapper/form-wrapper.component';
import { SelectOptions } from '../shared/components/form/select/select-options';

pdfMake.vfs = pdfFonts.vfs;

@Component({
  selector: 'app-teddy-eddie-report',
  templateUrl: './teddy-eddie-report.component.html',
  styleUrls: ['./teddy-eddie-report.component.scss'],
  standalone: true,
  imports: [
    TeddyEddieFormComponent,
    TranslateModule,
    ButtonComponent,
    SectionTitleComponent,
    ReactiveFormsModule,
    TeddyEddieTableComponent,
    CambridgePathTableComponent,
    FormWrapperComponent,
  ],
})
export class TeddyEddieReportComponent {
  private fb = inject(FormBuilder);

  public form: FormGroup = this.fb.nonNullable.group({
    studentName: null,
    name: null,
    date: null,
    class: [{ value: null, disabled: true }],
    course: null,
    age: null,
    avgMark: null,
    frequency: null,
    developmentLanguageSkillsArray: this.fb.array([]),
    teddyEddieArray: this.fb.array([]),
    learningRecommendations: null,
    recommendations: this.fb.array([]),
    additionalComment: null,
    signature: null,
  });

  public classes: string[] = studentsAgeTE;
  public ageTE: SelectOptions<string>[] = ageTE;

  public schoolYears: string[] = schoolYears;
  public languageLevels: string[] = languageLevels;
  public certificationPurpose: string[] = certificationPurpose;
  public schoolExamsTE: string[] = schoolExamsTE;
  public courses: string[] = coursesTE;
  public booksToChoosingTE: string[] = booksToChoosingTE;
  public courseLevelTE: string[] = courseLevelTE;

  public indexClass = 0;
  public indexClassTE = 0;

  private readonly imageLogo: string = image;
  private readonly banerLogo: string = baner;

  public initClassesFromFirstSelectedClass(classValue: string): void {
    this.indexClass = this.classes.findIndex((r: string) => r === classValue);

    const shortClassesInSchool: string[] = this.classes.slice(this.indexClass);
    const yearsCount: number = this.teddyEddieArray.length;

    const newArray = new FormArray<FormGroup>([]);
    for (let i = 0; i < shortClassesInSchool.length; i++) {
      newArray.push(
        new FormGroup({
          schoolYear: new FormControl({
            value: this.schoolYears[i + yearsCount],
            disabled: true,
          }),
          classInSchool: new FormControl({
            value: shortClassesInSchool[i],
            disabled: true,
          }),
          course: new FormControl(null),
          courseLevel: new FormControl(null),
          schoolExam: new FormControl({
            value: this.addSchoolExam(shortClassesInSchool[i]),
            disabled: this.setDisabledInSchoolExam(shortClassesInSchool[i]),
          }),
          certificationPurpose: new FormControl(null),
          shouldDeleteRow: new FormControl(false),
        })
      );
    }

    this.form.setControl('developmentLanguageSkillsArray', newArray);
  }

  public initTableTE(age: string): void {
    this.indexClassTE = this.ageTE.findIndex((r: SelectOptions<string>) => r.value === age);

    const shortTable: SelectOptions<string>[] = this.ageTE.slice(this.indexClassTE);

    const newArray = new FormArray<FormGroup>([]);
    for (let i = 0; i < shortTable.length; i++) {
      newArray.push(
        new FormGroup({
          schoolYear: new FormControl({
            value: this.schoolYears[i],
            disabled: true,
          }),
          studentsAge: new FormControl({
            value: shortTable[i].value,
            disabled: true,
          }),
          course: new FormControl(null),
          courseLevel: new FormControl(null),
          book: new FormControl(null),
          shouldDeleteRow: new FormControl(false),
        })
      );
    }

    this.form.setControl('teddyEddieArray', newArray);
  }
  private addSchoolExam(shortClassesInSchool: string): string | null {
    switch (shortClassesInSchool) {
      case 'Klasa 3 SP':
        return 'Trzecioteścik';
      case 'Klasa 8 SP':
        return 'Egzamin 8-klasisty';
      default:
        return null;
    }
  }

  private setDisabledInSchoolExam(shortClassesInSchool: string): boolean {
    return !(shortClassesInSchool === 'Klasa IV LIC/TECH' || shortClassesInSchool === 'Klasa V TECH');
  }

  public setClasses(classValue: string): void {
    this.indexClass = this.classes.findIndex((r: string) => {
      return r === this.form.getRawValue()['class'];
    });

    this.initClassesFromFirstSelectedClass(classValue);
  }

  public setTableTE(age: string): void {
    this.initTableTE(age);
    this.setClasses('Klasa 2 SP');
  }

  get developmentLanguageSkillsArray(): FormArray {
    return this.form.get('developmentLanguageSkillsArray') as FormArray;
  }

  get teddyEddieArray(): FormArray {
    return this.form.get('teddyEddieArray') as FormArray;
  }

  additionalComment(form: FormGroup): any {
    if (this.form.getRawValue().additionalComment !== null) {
      return {
        text: form.value.additionalComment,
        fontSize: 9,
      };
    } else {
      return {};
    }
  }

  realizedMaterial(form: FormGroup): any {
    if (form.value.allMaterialCompleted) {
      return { text: 'Pierwsza połowa materiału' };
    } else if (form.value.halfMaterialCompleted) {
      return { text: 'Cały materiał' };
    } else if (!form.value.allMaterialCompleted && !form.value.halfMaterialCompleted) {
      return { text: `${form.value.realizedMaterial}` };
    }
  }

  public downloadPDF(): any {
    this.generatePDF(this.form);
  }

  public generatePDF(form: FormGroup): any {
    const date: string = new Date(form.value.date).toLocaleDateString();

    const docDefinition = {
      content: [
        {
          image: this.banerLogo,
          width: 250,
          height: 65,
          alignment: 'center',
          margin: [0, 0, 0, 10],
        },
        {
          text: 'Prognozowana ścieżka rozwoju językowego',
          bold: true,
          margin: [0, 15, 0, 5],
          fontSize: 15,
          alignment: 'center',
        },
        {
          text: [`Imię i Nazwisko: `, { text: `${form.value.studentName}`, style: 'subtitle' }],
          margin: [0, 5, 0, 5],
          alignment: 'center',
        },
        {
          text: [`Data: `, { text: `${date}`, style: 'subtitle' }],
          margin: [0, 5, 0, 40],
          alignment: 'center',
        },
        {
          text: 'Gratulujemy zaangażowania w tym roku szkolnym!',
          margin: [0, 0, 0, 5],
          fontSize: 11,
          alignment: 'center',
        },
        {
          text: 'Poniżej przedstawiamy prognozowaną ścieżkę rozwoju językowego ucznia na kolejne lata.',
          margin: [0, 0, 0, 40],
          fontSize: 11,
          alignment: 'center',
        },
        {
          text: 'METODA TEDDY EDDIE - zanurzenie w angielski',
          margin: [0, 0, 0, 0],
          fontSize: 11,
          alignment: 'center',
          bold: true,
        },
        this.generateTETable(form),
        {
          text: 'ŚCIEŻKA CAMBRIDGE - cele certyfikacyjne',
          margin: [0, 5, 0, 0],
          fontSize: 11,
          alignment: 'center',
          bold: true,
        },
        this.generateDevelopmentLanguageSkillsTable(form),
        {
          text:
            'W zależności od przyszłorocznego wkładu pracy, czyli poziomu motywacji i zaangażowania na\n' +
            'lekcjach oraz systematyczności utrwalania wiedzy w domu, prognozowana ścieżka rozwoju\n' +
            'językowego może ulec zmianie na koniec kolejnego roku szkolnego.',
          margin: [0, 15, 0, 5],
          fontSize: 11,
          alignment: 'center',
        },
        {
          text: 'Trzymamy kciuki za dalszy piękny rozwój językowy!',
          margin: [0, 15, 0, 10],
          fontSize: 11,
          alignment: 'center',
        },
        {
          image: this.imageLogo,
          width: 125,
          height: 110,
          alignment: 'center',
          margin: [0, 20, 0, 0],
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
        gradingScale: {
          margin: [0, 10, 0, 2],
          fontSize: 9,
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

    const fileName: string = 'Raport końcowy 2025-26 - ' + form.value.studentName;
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  private generateRowsInDevelopmentLanguageSkillsTable(form: FormGroup): any {
    const formValue = form.getRawValue();

    const arraySkills: DevelopmentPathInSchool[] = [];

    formValue.developmentLanguageSkillsArray.forEach((row: DevelopmentPathInSchool) => {
      if (!row.shouldDeleteRow) {
        arraySkills.push(row);
      }
    });

    const arrayWithObjects: any[] = [];

    arrayWithObjects.push([
      {
        text: 'Rok szkolny',
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: `Klasa ucznia w szkole`,
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: 'W kierunku poziomu',
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: 'Cel certyfikacyjny',
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: 'Egzamin szkolny',
        style: 'tableHeader',
        alignment: 'center',
      },
    ]);

    for (const item of arraySkills) {
      arrayWithObjects.push([
        {
          text: item.schoolYear,
          alignment: 'center',
        },
        {
          text: item.classInSchool,
          alignment: 'center',
        },
        {
          text: item.courseLevel ? item.courseLevel : '',
          alignment: 'center',
        },
        {
          text: item.certificationPurpose ? item.certificationPurpose : '',
          alignment: 'center',
        },
        {
          text: item.schoolExam ? item.schoolExam : '',
          alignment: 'center',
        },
      ]);
    }

    return arrayWithObjects;
  }

  private generateRowsInTETable(form: FormGroup): any {
    const formValue = form.getRawValue();

    const arraySkills: DevelopmentPathTeddyEddie[] = [];

    formValue.teddyEddieArray.forEach((row: DevelopmentPathTeddyEddie) => {
      if (!row.shouldDeleteRow) {
        arraySkills.push(row);
      }
    });

    const arrayWithObjects: any[] = [];

    arrayWithObjects.push([
      {
        text: 'Rok szkolny',
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: `Wiek ucznia`,
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: 'Kurs',
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: 'Poziom kursu',
        style: 'tableHeader',
        alignment: 'center',
      },
      {
        text: 'Księga',
        style: 'tableHeader',
        alignment: 'center',
      },
    ]);

    for (const item of arraySkills) {
      arrayWithObjects.push([
        {
          text: item.schoolYear,
          alignment: 'center',
        },
        {
          text: item.studentsAge,
          alignment: 'center',
        },
        {
          text: item.course,
          alignment: 'center',
        },
        {
          text: item.courseLevel ? item.courseLevel : '',
          alignment: 'center',
        },
        {
          text: item.book,
          alignment: 'center',
        },
      ]);
    }

    return arrayWithObjects;
  }

  private generateDevelopmentLanguageSkillsTable(form: FormGroup) {
    return {
      style: 'tableExample',
      margin: [0, 5, 0, 10],
      table: {
        widths: ['auto', '*', '*', '*', '*'],
        headerRows: 1,
        body: this.generateRowsInDevelopmentLanguageSkillsTable(form),
      },
    };
  }

  private generateTETable(form: FormGroup) {
    return {
      style: 'tableExample',
      margin: [0, 5, 0, 25],
      table: {
        widths: ['auto', '*', '*', '*', '*'],
        headerRows: 1,
        body: this.generateRowsInTETable(form),
      },
    };
  }
}
