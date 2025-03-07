import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ELEMENT_DATA, TableElement } from '../rating-scale/table-elements';
import { classes, teachers, books, courses } from '../shared/select-values';
import { Marks, marks } from '../shared/marks';
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
  parentDecisionValues,
  recommendationsInNextYear,
} from '../shared/year-report/year-report-static-data';
import { FileBase64 } from '../shared/base64/file-base64';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
    selector: 'app-year-report',
    templateUrl: './year-report.component.html',
    styleUrls: ['./year-report.component.scss'],
    standalone: false
})
export class YearReportComponent implements OnInit {
  title: string = 'britannia-reports';

  public form!: FormGroup;

  public classes: string[] = classes;
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

  public parentDecisionValues: string[] = parentDecisionValues;
  public certificationPurposeOnThisYear: string[] =
    certificationPurposeOnThisYear;
  public markEvaluations: string[] = markEvaluations;
  public recommendationsInNextYear: string[] = recommendationsInNextYear;

  public readonly examsRecommendations: string[] = examsRecommendationsInTable;

  public isCheckedBook: boolean = false;
  public isCheckedOwnTitle: boolean = false;

  public indexClass: number = 0;

  private readonly banerLogo: string = FileBase64.baner;

  ngOnInit(): void {
    this.form = this.createForm();
  }

  public initClassesFromFirstSelectedClass(classValue: string): void {
    let newClasses: string[] = this.classes.slice(0, -1);

    this.indexClass = newClasses.findIndex((r: string) => {
      return r === classValue;
    });

    let shortClassesInSchool: string[] = this.classesInSchool.slice(
      this.indexClass,
      this.classesInSchool.length
    );

    const clearFormArray = (formArray: FormArray) => {
      while (formArray.length !== 0) {
        formArray.removeAt(0);
      }
    };

    clearFormArray(
      this.form.get('developmentLanguageSkillsArray') as FormArray
    );

    for (let i: number = 0; i < shortClassesInSchool.length; i++) {
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
    return !(
      shortClassesInSchool === 'Klasa IV LIC/TECH' ||
      shortClassesInSchool === 'Klasa V TECH'
    );
  }

  public setClasses(classValue: string): void {
    let newClasses: string[] = this.classes.slice(0, -1);

    this.indexClass = newClasses.findIndex((r: string) => {
      return r === this.form.getRawValue()['class'];
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
    } else if (
      !form.value.allMaterialCompleted &&
      !form.value.halfMaterialCompleted
    ) {
      return { text: `${form.value.realizedMaterial}` };
    }
  }

  certificationPurposeText(form: FormGroup): any {
    if (
      form.value.certificationPurposeYES ||
      form.value.certificationPurposeNO
    ) {
      return {
        text: `Cel certyfikacyjny na bieżący rok szkolny: ${
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
    let date: string = new Date(form.value.date).toLocaleDateString();

    let docDefinition = {
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
          margin: [0, 10, 0, 5],
        },
        {
          text: 'Oto prognozowana ścieżka rozwoju językowego po bieżącym roku szkolnym.',
          margin: [0, 0, 0, 0],
          fontSize: 9,
        },
        this.generateDevelopmentLanguageSkillsTable(form),
        this.certificationPurposeText(form),
        {
          text: 'W zależności od przyszłorocznego wkładu pracy, czyli poziomu zaangażowania na lekcjach i systematyczności utrwalania wiedzy w domu, prognozowana ścieżka rozwoju językowego może ulec zmianie na koniec kolejnego roku szkolnego. ',
          margin: [0, 5, 0, 0],
          fontSize: 9,
        },
        {
          text: '*Tryb nauki',
          style: 'header',
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
    let formValue = form.getRawValue();

    let arrDetails: any[] = [];
    arrDetails.push([
      {
        text: 'Ocena końcoworoczna',
        style: 'tableHeader',
      },
      {
        text: `${formValue.eofEvaluation ? formValue.eofEvaluation : '-'}`,
      },
    ]);

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
          text: 'Cel certyfikacyjny na bieżący rok szkolny',
          noWrap: true,
          style: 'tableHeader',
        },
        {
          text: `${formValue.certificationPurposeOnThisYear}`,
        },
      ]);
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

    arrDetails.push([
      {
        text: 'Tryb nauki* rekomendowany na przyszły rok szkolny',
        noWrap: true,
        style: 'tableHeader',
      },
      {
        text: `${formValue.recommendationInNextYear}`,
      },
    ]);

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
      studentName: new FormControl(null, Validators.required),
      name: new FormControl(null, Validators.required),
      sex: new FormControl(null, Validators.required),
      date: new FormControl(null, Validators.required),
      class: new FormControl(null, Validators.required),
      teacher: new FormControl(null, Validators.required),
      studentBookTitle: new FormControl(null, Validators.required),
      ownTitleStudentBook: new FormControl(null, Validators.required),
      ownEducationMaterial: new FormControl(false),
      course: new FormControl(null, Validators.required),
      realizedMaterial: new FormControl(null),
      allMaterialCompleted: new FormControl(false),
      halfMaterialCompleted: new FormControl(false),

      eofEvaluation: new FormControl(null),
      frequency: new FormControl(null),

      // table with student development path
      developmentLanguageSkillsArray: new FormArray([]),

      // table with language details
      parentDecision: new FormControl(false),
      certificationPurposeOnThisYear: new FormControl(null),
      examRecommendationInTable: new FormControl(null),
      recommendationInNextYear: new FormControl(null),

      // checkbox in array - delete row
      frequencyDelete: new FormControl(false),
      certificationPurposeOnThisYearDelete: new FormControl(false),
      examRecommendationInTableDelete: new FormControl(false),
      parentDecisionDelete: new FormControl(false),

      comments: new FormArray([]),

      additionalComment: new FormControl(null),
      signature: new FormControl(null, Validators.required),
    });
  }
}
