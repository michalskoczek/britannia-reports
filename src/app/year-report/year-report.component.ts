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
  additionalExamInformations,
  examsRecommendations,
  examsSelect,
  learningRecommendations,
  resultOfExam,
} from '../shared/exams';
import { image } from '../shared/images-base64';
import { baner } from '../shared/baner-base64';
import {
  certificationPurpose,
  classesInSchool,
  languageLevels,
  schoolExam,
  schoolYears,
} from '../shared/development-path';
import { DevelopmentPathInSchool } from '../model/development-path-in-school';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-year-report',
  templateUrl: './year-report.component.html',
  styleUrls: ['./year-report.component.scss'],
})
export class YearReportComponent implements OnInit {
  title: string = 'britannia-reports';

  public form!: FormGroup;

  public readonly sexes: string[] = ['Uczeń', 'Uczennica'];
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

  public readonly resultOfExam: string[] = resultOfExam;
  public readonly examsSelect: string[] = examsSelect;
  public selectedTypeOfExam: string = '';
  public selectedSchoolYear: string = '';
  public selectedCertificationPurpose: string = '';

  public readonly examsRecommendations: string[] = examsRecommendations;

  public isChecked: boolean = false;
  public isCheckedBook: boolean = false;
  public isCheckedOwnTitle: boolean = false;

  public learningRecommendations: string[] = learningRecommendations;

  public indexClass: number = 0;

  private readonly additionalExamInformations: string[] =
    additionalExamInformations;
  private readonly imageLogo: string = image;
  private readonly banerLogo: string = baner;

  ngOnInit(): void {
    this.form = this.createForm();
    // this.createExamsFormArray();
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
        break;
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

  get developmentLanguageSkillsArray(): FormArray {
    return this.form.get('developmentLanguageSkillsArray') as FormArray;
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

  public onSelectSchoolYear(year: string): void {
    this.selectedSchoolYear = year;
  }

  public onSelectLanguageLevels(level: string): void {
    this.selectedSchoolYear = level;
  }

  public onSelectCertificationPurpose(certification: string): void {
    this.selectedCertificationPurpose = certification;
  }

  public onCheckboxChange(): void {
    this.isChecked = !this.isChecked;
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

  isAdditionalComment(): any {
    if (this.form.getRawValue().additionalComment !== null) {
      return {
        text: 'Dodatkowy komentarz',
        style: 'header',
        margin: [0, 0, 0, 5],
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

  parentDecision(form: FormGroup): any {
    if (
      form.value.parentDecisionYES === false &&
      form.value.parentDecisionNO === false &&
      form.value.parentDecisionNONE === false
    ) {
      return {};
    } else {
      return {
        text: `Decyzja Rodzica o podchodzeniu przez ucznia do oficjalnego egzaminu: ${
          form.value.parentDecisionYES
            ? 'Tak'
            : form.value.parentDecisionNO
            ? 'Nie'
            : form.value.parentDecisionNONE
            ? 'Brak'
            : ''
        }`,
        style: 'header',
        margin: [0, 10, 0, 5],
      };
    }
  }

  public generatePDF(form: FormGroup): any {
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
          image: this.banerLogo,
          width: 250,
          height: 65,
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
          text: 'Nasza skala ocen',
          bold: true,
          margin: [0, 15, 0, 0],
        },
        {
          style: 'gradingScale',
          table: {
            widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*'],
            body: [
              [
                {
                  text: '100%+',
                },
                {
                  text: '6*',
                },
                {
                  text: '',
                  rowSpan: 3,
                  border: [false, false, false, false],
                },
                {
                  text: '85-89%',
                },
                {
                  text: '4+',
                },
                {
                  text: '',
                  rowSpan: 3,
                  border: [false, false, false, false],
                },
                {
                  text: '70-74%',
                },
                {
                  text: '3+',
                },
                {
                  text: '',
                  rowSpan: 3,
                  border: [false, false, false, false],
                },
                {
                  text: '55-59%',
                },
                {
                  text: '2+',
                },
              ],
              [
                {
                  text: '96-100%',
                },
                {
                  text: '5',
                },
                '',
                {
                  text: '80-84%',
                },
                {
                  text: '4',
                },
                '',
                {
                  text: '64-69%',
                },
                {
                  text: '3',
                },
                '',
                {
                  text: '45-54%',
                },
                {
                  text: '2',
                },
              ],
              [
                {
                  text: '90-95%',
                },
                {
                  text: '5-',
                },
                '',
                {
                  text: '75-79%',
                },
                {
                  text: '4-',
                },
                '',
                {
                  text: '60-63%',
                },
                {
                  text: '3-',
                },
                '',
                {
                  text: '0-44%',
                },
                {
                  text: '1',
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
          style: 'tableExample',
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  text: 'Ocena końcoworoczna',
                  style: 'tableHeader',
                },
                {
                  text: `${form.value.avgMark ? form.value.avgMark : '-'}`,
                },
              ],
              [
                {
                  text: 'Frekwencja',
                  style: 'tableHeader',
                },
                {
                  text: `${
                    form.value.frequency ? form.value.frequency + '%' : '-'
                  }`,
                },
              ],
            ],
          },
        },
        {
          text: 'Prognozowana ścieżka rozwoju językowego',
          style: 'header',
          margin: [0, 15, 0, 5],
        },
        {
          text: 'Oto prognozowana ścieżka rozwoju językowego po bieżącym roku szkolnym.',
          margin: [0, 0, 0, 5],
          fontSize: 9,
        },
        {
          text: 'W zależności od przyszłorocznego wkładu pracy, czyli poziomu zaangażowania na lekcjach i systematyczności utrwalania wiedzy w domu, prognozowana ścieżka rozwoju językowego może ulec zmianie na koniec kolejnego roku szkolnego. ',
          margin: [0, 0, 0, 5],
          fontSize: 9,
        },
        this.generateDevelopmentLanguageSkillsTable(form),
        {
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
        },
        {
          text: 'Poziom biegłości',
          style: 'header',
          margin: [0, 15, 0, 5],
        },
        {
          text:
            'Zależy nam na tym, by jak najwcześniej diagnozować poziom umiejętności dzieci, by jak najszybciej łączyć je w grupy według poziomu ich umiejętności, by mogły rozwijać się językowo w swoim tempie i jak najpełniej korzystać z lekcji. Jak co roku została przeprowadzona diagnoza poziomu języka naszych uczniów według Europejskiego Systemu Kształcenia Językowego z wykorzystaniem próbnych egzaminów Cambridge. \n' +
            '\n' +
            'Testy Cambridge dla dzieci to testy przekrojowe, diagnostyczne - nie można ich nie zdać, mają wskazać poziom biegłości językowej. Ważne są procenty. Uznajemy, że uczeń wskoczył na dany poziom biegłości, jeśli uzyskał minimum 60%. Jednak, by stwierdzić, że uczeń faktycznie osiągnął dany poziom językowy i może przystąpić do oficjalnego egzaminu Cambridge, powinien osiągnąć on ok. 80% z testów próbnych. Na testach próbnych diagnozujemy umiejętności Słuchania oraz Czytania i Pisania. Na egzaminie jest też Mówienie, co ćwiczymy i sprawdzamy na bieżąco.',
          fontSize: 9,
        },
        {
          text: [
            `${form.value.typeOfExam ? 'Rodzaj egzaminu:' : ''}`,
            form.value.typeOfExam,
          ],
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
          bold: true,
          margin: [0, 5, 0, 5],
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
        this.parentDecision(form),
        {
          text: 'Organizacja kolejnego roku nauki',
          bold: true,
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
        this.isAdditionalComment(),
        this.additionalComment(form),
        {
          text: form.value.signature,
          margin: [0, 20, 0, 10],
          fontSize: 10,
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
        text: 'egzamin szkolny',
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
        widths: ['*', '*', '*', '*', '*'],
        headerRows: 1,
        body: this.generateRowsInDevelopmentLanguageSkillsTable(form),
      },
    };
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
      ownTitleStudentBook: new FormControl(null, Validators.required),
      ownEducationMaterial: new FormControl(false),
      course: new FormControl(null, Validators.required),
      realizedMaterial: new FormControl(null, Validators.required),

      avgMark: new FormControl(null),
      frequency: new FormControl(null),

      developmentLanguageSkillsArray: new FormArray([]),

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

      parentDecisionYES: new FormControl(false),
      parentDecisionNO: new FormControl(false),
      parentDecisionNONE: new FormControl(false),
      certificationPurposeYES: new FormControl(false),
      certificationPurposeNO: new FormControl(false),

      learningRecommendations: new FormControl(null),
      recommendations: new FormArray([]),

      additionalComment: new FormControl(null),
      signature: new FormControl(null, Validators.required),
    });
  }
}
