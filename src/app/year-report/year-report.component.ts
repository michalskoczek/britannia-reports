import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
// @ts-expect-error pdfMake
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-expect-error pdfFont
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ELEMENT_DATA, TableElement } from '../rating-scale/table-elements';
import { classes, teachers, books, courses } from '../shared/select-values';
import { Marks, marks } from '../shared/marks';
import { baner } from '../shared/baner-base64';
import {
  certificationPurpose,
  classesInSchool,
  languageLevels,
  schoolExam,
  schoolYears,
} from '../shared/development-path';
import { DevelopmentPathInSchool } from '../model/development-path-in-school';
import {
  certificationPurposeOnThisYear,
  examsRecommendationsInTable,
  markEvaluations,
  parentDecisionValues, readinessToContinueOnNextLevelOptions,
  recommendationsInNextYear,
} from '../shared/year-report/year-report-static-data';
import { MatFormField, MatHint, MatInput, MatLabel } from '@angular/material/input';
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
  selector: 'app-year-report',
  templateUrl: './year-report.component.html',
  styleUrls: ['./year-report.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    TranslateModule,
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
export class YearReportComponent implements OnInit {
  title = 'britannia-reports';

  public form!: FormGroup;

  public classes: { label: string; value: string }[] = classes;
  public readonly teachers: string[] = teachers;
  public readonly books: string[] = books;
  public readonly courses: string[] = courses;
  public readonly displayedColumns: string[] = ['percent', 'mark'];
  public readonly dataSource: TableElement[] = ELEMENT_DATA;
  public readonly marks: Marks[] = marks;

  public schoolYears: string[] = schoolYears;
  public languageLevels: string[] = languageLevels;
  public classesInSchool: string[] = classesInSchool;
  public certificationPurpose: string[] = certificationPurpose;
  public schoolExam: string[] = schoolExam;

  public parentDecisionValues: { label: string; value: string }[] = parentDecisionValues;
  public certificationPurposeOnThisYear: { label: string; value: string }[] =
    certificationPurposeOnThisYear;
  public markEvaluations: { label: string; value: string }[] = markEvaluations;
  public recommendationsInNextYear: { label: string; value: string }[] = recommendationsInNextYear;
  public readinessToContinueOnNextLevelOptions: { label: string; value: string }[] = readinessToContinueOnNextLevelOptions;

  public readonly examsRecommendations: { label: string; value: string }[] = examsRecommendationsInTable;

  public isCheckedBook = false;
  public isCheckedOwnTitle = false;

  public indexClass = 0;

  private readonly banerLogo: string = baner;

  ngOnInit(): void {
    this.form = this.createForm();
  }

  public initClassesFromFirstSelectedClass(classValue: string): void {
    const newClasses: { label: string; value: string }[] = this.classes.slice(0, -1);

    this.indexClass = newClasses.findIndex((r: { label: string; value: string }) => {
      return r.value === classValue;
    });

    const shortClassesInSchool: string[] = this.classesInSchool.slice(
      this.indexClass,
      this.classesInSchool.length
    );

    const clearFormArray = (formArray: FormArray) => {
      while (formArray.length !== 0) {
        formArray.removeAt(0);
      }
    };

    clearFormArray(this.form.get('developmentLanguageSkillsArray') as FormArray);

    for (let i = 0; i < shortClassesInSchool.length; i++) {
      (this.form.get('developmentLanguageSkillsArray') as FormArray).push(
        new FormGroup({
          schoolYear: new FormControl({
            value: this.schoolYears[i],
            disabled: true,
          }),
          classInSchool: new FormControl({
            value: shortClassesInSchool[i],
            disabled: true,
          }),
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

  private addSchoolExam(shortClassesInSchool: string): string | null {
    switch (shortClassesInSchool) {
      case 'Klasa 8 SP':
        return 'egzamin 8-klasisty';
      default:
        return null;
    }
  }

  private setDisabledInSchoolExam(shortClassesInSchool: string): boolean {
    return !(shortClassesInSchool === 'Klasa IV LIC/TECH' || shortClassesInSchool === 'Klasa V TECH');
  }

  public setClasses(classValue: string): void {
    const newClasses: { label: string; value: string }[] = this.classes.slice(0, -1);

    this.indexClass = newClasses.findIndex((r: { label: string; value: string }) => {
      return r.value === this.form.getRawValue()['class'];
    });

    this.initClassesFromFirstSelectedClass(classValue);
  }

  get developmentLanguageSkillsArray(): FormArray {
    return this.form.get('developmentLanguageSkillsArray') as FormArray;
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

  isAdditionalComment(): any {
    if (this.form.getRawValue().additionalComment !== null) {
      return {
        text: 'Dodatkowy komentarz',
        style: 'header',
        margin: [0, 10, 0, 0],
      };
    } else {
      return {};
    }
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

  certificationPurposeText(form: FormGroup): any {
    if (form.value.certificationPurposeYES || form.value.certificationPurposeNO) {
      return {
        text: `Stopień opanowania materiału kursowego: ${
          form.value.certificationPurposeYES
            ? 'zrealizowany'
            : form.value.certificationPurposeNO
              ? 'niezrealizowany'
              : ''
        }`,
        bold: true,
        fontSize: 10,
        margin: [0, 10, 0, 0],
      };
    } else {
      return {};
    }
  }

  public generatePDF(form: FormGroup): any {
    const date: string = new Date(form.value.date).toLocaleDateString('pl-PL');

    const addSpaceAfterTeacher = (teachers: string[]) => {
      if (!teachers) return;

      return teachers.join(', ');
    };

    const docDefinition = {
      content: [
        {
          image: this.banerLogo,
          width: 200,
          height: 50,
          alignment: 'center',
          margin: [0, 0, 0, 10],
        },
        {
          text: 'RAPORT KOŃCOWOROCZNY',
          style: 'title',
          alignment: 'center',
        },
        {
          text: 'PODSUMOWANIE NAUKI I DALSZE REKOMENDACJE',
          style: 'title',
          alignment: 'center',
        },
        {
          text: [`Imię i Nazwisko ucznia: `, { text: `${form.value.studentName}`, style: 'subtitle' }],
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
                { text: `${form.value.class.value}` },
              ],
              [
                { text: 'Lektor', style: 'tableHeader' },
                { text: `${addSpaceAfterTeacher(form.value.teachers)}` },
                {
                  text: 'Tytuł podręcznika',
                  noWrap: true,
                  style: 'tableHeader',
                },
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
                {
                  text: 'Zrealizowany materiał',
                  noWrap: true,
                  style: 'tableHeader',
                },
                this.realizedMaterial(form),
              ],
            ],
          },
        },
        this.generateStudentLanguageDetails(form),
        {
          text: 'Prognozowana ścieżka rozwoju językowego',
          style: 'header',
          margin: [0, 20, 0, 5],
        },
        {
          text: 'Całoroczna praca ucznia, jego zaangażowanie podczas zajęć, stopień opanowania materiału oraz wyniki testów bieżących\ni próbnych egzaminów diagnozujących są dla nas bardzo ważne i stanowią podstawę do planowania dalszej ścieżki rozwoju językowego. Na tej podstawie kwalifikujemy uczniów do grup o zbliżonych kompetencjach językowych, możliwościach oraz tempie pracy w kolejnym roku szkolnym.',
          margin: [0, 0, 0, 0],
          fontSize: 9,
        },
        {
          text: 'Podczas tworzenia prognozowanej ścieżki rozwoju bierzemy pod uwagę nie tylko wyniki osiągane przez ucznia, ale również jego indywidualne predyspozycje językowe, systematyczność, motywację oraz aktywność na lekcjach w trakcie całego roku szkolnego.',
          margin: [0, 5, 0, 0],
          fontSize: 9,
        },
        {
          text: 'Warto pamiętać, że prognozowana ścieżka rozwoju językowego nie jest decyzją ostateczną. W zależności od przyszłorocznego poziomu zaangażowania ucznia, regularności utrwalania wiedzy w domu oraz wkładu pracy podczas zajęć, ścieżka ta może ulec zmianie pod koniec kolejnego roku szkolnego.Poniżej przedstawiamy prognozowaną ścieżkę rozwoju językowego ucznia po bieżącym roku nauki.',
          margin: [0, 5, 0, 0],
          fontSize: 9,
        },
        this.generateDevelopmentLanguageSkillsTable(form),
        this.certificationPurposeText(form),
        {
          text: '*Ścieżki egzaminacyjne',
          style: 'subheader',
          margin: [0, 10, 0, 5],
        },
        {
          text: [
            {
            text: 'Fast',
            bold: true,
            fontSize: 9,
            },
            {
            text: ' — ścieżka egzaminacyjna przyspieszonego rozwoju językowego',
            fontSize: 9,
            },
          ],
        },
        { text: '\n', fontSize: 5 },
        {
          text: [
            {
              text: 'Regular',
              bold: true,
              fontSize: 9,
            },
            {
              text: ' — ścieżka egzaminacyjna standardowego rozwoju językowego',
              fontSize: 9,
            },
          ],
        },
        { text: '\n', fontSize: 5 },
        {
          text: [
            {
              text: 'Steady',
              bold: true,
              fontSize: 9,
            },         {
              text: ' — ścieżka egzaminacyjna stabilnego rozwoju językowego',
              fontSize: 9,
            },
          ]
        },
        { text: '\n', fontSize: 4 },
        this.isAdditionalComment(),
        this.additionalComment(form),
        {
          text: form.value.signature,
          margin: [0, 5, 0, 0],
          fontSize: 9,
        },
      ],
      styles: {
        tableHeader: {
          fontSize: 10,
          bold: true,
        },
        tableExample: {
          margin: [0, 10, 0, 0],
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
          fontSize: 12,
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

  private generateDevelopmentLanguageSkillsTable(form: FormGroup) {
    return {
      style: 'tableExample',
      margin: [0, 5, 0, 2],
      table: {
        widths: ['auto', '*', '*', '*', '*'],
        headerRows: 1,
        body: this.generateRowsInDevelopmentLanguageSkillsTable(form),
      },
    };
  }

  private getBodyInSkills(form: FormGroup) {
    const formValue = form.getRawValue();

    const arrDetails: any[] = [];

    if (!formValue.eofEvaluationDelete) {
      arrDetails.push([
        {
          text: 'Ocena końcoworoczna',
          style: 'tableHeader',
        },
        {
          text: `${formValue.eofEvaluation ? formValue.eofEvaluation : '-'}`,
        },
      ]);
    }

    if (!formValue.frequencyDelete) {
      arrDetails.push([
        {
          text: 'Frekwencja',
          style: 'tableHeader',
        },
        {
          text: `${formValue.frequency ? formValue.frequency + '%' : '-'}`,
        },
      ]);
    }

    if (!formValue.certificationPurposeOnThisYearDelete) {
      arrDetails.push([
        {
          text: 'Stopień opanowania materiału kursowego',
          noWrap: true,
          style: 'tableHeader',
        },
        {
          text: `${formValue.certificationPurposeOnThisYear}`,
        },
      ]);
    }

    if (!formValue.readinessToContinueOnNextLevelDelete) {
      arrDetails.push([
        {
          text: 'Gotowość do kontynuacji nauki na kolejnym poziomie',
          noWrap: true,
          style: 'tableHeader',
        },
        {
          text: `${formValue.readinessToContinueOnNextLevel}`,
        },
      ])
    }

    if (!formValue.examRecommendationInTableDelete) {
      arrDetails.push([
        {
          text: 'Egzamin Cambridge rekomendowany po bieżącym roku szkolnym',
          noWrap: true,
          style: 'tableHeader',
        },
        {
          text: `${formValue.examRecommendationInTable}`,
        },
      ]);
    }

    if (!formValue.parentDecisionDelete) {
      arrDetails.push([
        {
          text: 'Decyzja Rodzica o podchodzeniu przez ucznia do oficjalnego egzaminu Cambridge',
          noWrap: true,
          style: 'tableHeader',
        },
        {
          text: `${formValue.parentDecision}`,
        },
      ]);
    }

    if (!formValue.recommendationInNextYearInTableDelete) {
      arrDetails.push([
        {
          text: 'Prognozowana ścieżka egzaminacyjna* na przyszły rok szkolny',
          noWrap: true,
          style: 'tableHeader',
        },
        {
          text: `${formValue.recommendationInNextYear}`,
        },
      ]);
    }


    return arrDetails;
  }

  private generateStudentLanguageDetails(form: FormGroup) {
    return {
      style: 'tableExample',
      table: {
        widths: ['*', 'auto'],
        body: this.getBodyInSkills(form),
      },
    };
  }

  private createForm(): FormGroup {
    return new FormGroup({
      studentName: new FormControl(null),
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
      allMaterialCompleted: new FormControl(false),
      halfMaterialCompleted: new FormControl(false),

      eofEvaluation: new FormControl(null),
      frequency: new FormControl(null),
      readinessToContinueOnNextLevel: new FormControl(null),

      // table with student development path
      developmentLanguageSkillsArray: new FormArray([]),

      // table with language details
      parentDecision: new FormControl(false),
      certificationPurposeOnThisYear: new FormControl(null),
      examRecommendationInTable: new FormControl(null),
      recommendationInNextYear: new FormControl(null),

      // checkbox in array - delete row
      eofEvaluationDelete: new FormControl(false),
      frequencyDelete: new FormControl(false),
      certificationPurposeOnThisYearDelete: new FormControl(false),
      examRecommendationInTableDelete: new FormControl(false),
      parentDecisionDelete: new FormControl(false),
      recommendationInNextYearInTableDelete: new FormControl(false),
      readinessToContinueOnNextLevelDelete: new FormControl(false),

      comments: new FormArray([]),

      additionalComment: new FormControl(null),
      signature: new FormControl(null),
    });
  }
}
