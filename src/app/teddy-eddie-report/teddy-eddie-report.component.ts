import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
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

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-teddy-eddie-report',
  templateUrl: './teddy-eddie-report.component.html',
  styleUrls: ['./teddy-eddie-report.component.scss'],
})
export class TeddyEddieReportComponent implements OnInit {
  public form: FormGroup;

  public classes: string[] = studentsAgeTE;
  public ageTE: string[] = ageTE;

  public schoolYears: string[] = schoolYears;
  public languageLevels: string[] = languageLevels;
  public certificationPurpose: string[] = certificationPurpose;
  public schoolExamsTE: string[] = schoolExamsTE;
  public courses: string[] = coursesTE;
  public booksToChoosingTE: string[] = booksToChoosingTE;
  public courseLevelTE: string[] = courseLevelTE;

  public indexClass: number = 0;
  public indexClassTE: number = 0;

  private readonly imageLogo: string = image;
  private readonly banerLogo: string = baner;

  ngOnInit(): void {
    this.form = this.createForm();
  }

  public initClassesFromFirstSelectedClass(classValue: string): void {
    this.indexClass = this.classes.findIndex((r: string) => {
      return r === classValue;
    });

    let shortClassesInSchool: string[] = this.classes.slice(
      this.indexClass,
      this.classes.length
    );

    const clearFormArray = (formArray: FormArray) => {
      while (formArray.length !== 0) {
        formArray.removeAt(0);
      }
    };

    clearFormArray(
      this.form.get('developmentLanguageSkillsArray') as FormArray
    );

    let yearsCount: number = this.teddyEddieArray.length;

    for (let i: number = 0; i < shortClassesInSchool.length; i++) {
      (this.form.get('developmentLanguageSkillsArray') as FormArray).push(
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
  }

  public initTableTE(age: string): void {
    this.indexClassTE = this.ageTE.findIndex((r: string) => {
      return r === age;
    });

    let shortTable: string[] = this.ageTE.slice(
      this.indexClassTE,
      this.ageTE.length
    );

    const clearFormArray = (formArray: FormArray) => {
      while (formArray.length !== 0) {
        formArray.removeAt(0);
      }
    };

    clearFormArray(this.form.get('teddyEddieArray') as FormArray);

    for (let i: number = 0; i < shortTable.length; i++) {
      (this.form.get('teddyEddieArray') as FormArray).push(
        new FormGroup({
          schoolYear: new FormControl({
            value: this.schoolYears[i],
            disabled: true,
          }),
          studentsAge: new FormControl({
            value: shortTable[i],
            disabled: true,
          }),
          course: new FormControl(null),
          courseLevel: new FormControl(null),
          book: new FormControl(null),
          shouldDeleteRow: new FormControl(false),
        })
      );
    }
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
    return !(
      shortClassesInSchool === 'Klasa IV LIC/TECH' ||
      shortClassesInSchool === 'Klasa V TECH'
    );
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
    } else if (
      !form.value.allMaterialCompleted &&
      !form.value.halfMaterialCompleted
    ) {
      return { text: `${form.value.realizedMaterial}` };
    }
  }

  public generatePDF(form: FormGroup): any {
    let date: string = new Date(form.value.date).toLocaleDateString();

    let docDefinition = {
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
          text: [
            `Imię i Nazwisko: `,
            { text: `${form.value.studentName}`, style: 'subtitle' },
          ],
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

    const fileName: string =
      'Raport końcowy 2023-24 - ' + form.value.studentName;
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  private generateRowsInDevelopmentLanguageSkillsTable(form: FormGroup): any {
    let formValue = form.getRawValue();

    let arraySkills: DevelopmentPathInSchool[] = [];

    formValue.developmentLanguageSkillsArray.forEach(
      (row: DevelopmentPathInSchool) => {
        if (!row.shouldDeleteRow) {
          arraySkills.push(row);
        }
      }
    );

    let arrayWithObjects: any[] = [];

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

    for (let i: number = 0; i < arraySkills.length; i++) {
      arrayWithObjects.push([
        {
          text: arraySkills[i].schoolYear,
          alignment: 'center',
        },
        {
          text: arraySkills[i].classInSchool,
          alignment: 'center',
        },
        {
          text: arraySkills[i].courseLevel ? arraySkills[i].courseLevel : '',
          alignment: 'center',
        },
        {
          text: arraySkills[i].certificationPurpose
            ? arraySkills[i].certificationPurpose
            : '',
          alignment: 'center',
        },
        {
          text: arraySkills[i].schoolExam ? arraySkills[i].schoolExam : '',
          alignment: 'center',
        },
      ]);
    }

    return arrayWithObjects;
  }

  private generateRowsInTETable(form: FormGroup): any {
    let formValue = form.getRawValue();

    let arraySkills: DevelopmentPathTeddyEddie[] = [];

    formValue.teddyEddieArray.forEach((row: DevelopmentPathTeddyEddie) => {
      if (!row.shouldDeleteRow) {
        arraySkills.push(row);
      }
    });

    let arrayWithObjects: any[] = [];

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

    for (let i: number = 0; i < arraySkills.length; i++) {
      arrayWithObjects.push([
        {
          text: arraySkills[i].schoolYear,
          alignment: 'center',
        },
        {
          text: arraySkills[i].studentsAge,
          alignment: 'center',
        },
        {
          text: arraySkills[i].course,
          alignment: 'center',
        },
        {
          text: arraySkills[i].courseLevel ? arraySkills[i].courseLevel : '',
          alignment: 'center',
        },
        {
          text: arraySkills[i].book,
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

  private createForm(): FormGroup {
    return new FormGroup({
      studentName: new FormControl(null, Validators.required),
      name: new FormControl(null, Validators.required),
      date: new FormControl(null, Validators.required),
      class: new FormControl({ value: null, disabled: true }),

      course: new FormControl(null, Validators.required),

      age: new FormControl(null),

      avgMark: new FormControl(null),
      frequency: new FormControl(null),

      developmentLanguageSkillsArray: new FormArray([]),
      teddyEddieArray: new FormArray([]),

      learningRecommendations: new FormControl(null),
      recommendations: new FormArray([]),

      additionalComment: new FormControl(null),
      signature: new FormControl(null, Validators.required),
    });
  }
}
