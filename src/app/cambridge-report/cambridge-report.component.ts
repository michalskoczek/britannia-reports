import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { classes, teachers, courses } from '../shared/select-values';
import { Marks, marks } from '../shared/marks';
import {
  examsRecommendations,
  examsSelect,
  resultOfExam,
} from '../shared/exams';
import { GoogleAuthService } from '../service/google-auth.service';
import { DocumentDefinitionBase } from '../helper/document-definition/cambridge/document-definition-base';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
    selector: 'app-cambridge-report',
    templateUrl: './cambridge-report.component.html',
    styleUrls: ['./cambridge-report.component.scss'],
    standalone: false
})
export class CambridgeReportComponent implements OnInit {
  constructor(private googleAuthService: GoogleAuthService) {}

  public form: FormGroup;

  public readonly classes: string[] = classes;
  public readonly teachers: string[] = teachers;
  public readonly courses: string[] = courses;
  public readonly marks: Marks[] = marks;
  public readonly resultOfExam: string[] = resultOfExam;
  public readonly examsSelect: string[] = examsSelect;
  public selectedTypeOfExam: string = '';
  public readonly examsRecommendations: string[] = examsRecommendations;
  public isChecked: boolean = false;

  ngOnInit(): void {
    this.form = this.createForm();
    this.googleAuthService.gapiLoaded();
    this.googleAuthService.gisLoaded();
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
    const control = <FormArray>this.form.controls[nameOfArray];
    control.removeAt(index);
  }

  public generatePDF(form: FormGroup): void {
    const docDefinition: any =
      DocumentDefinitionBase.initDocumentDefinition(form);
    const fileName: string = DocumentDefinitionBase.initFileName(form);

    pdfMake.createPdf(docDefinition).download(fileName);
  }

  public sendPDF(form: FormGroup): void {
    const docDefinition: any =
      DocumentDefinitionBase.initDocumentDefinition(form);
    const fileName: string = DocumentDefinitionBase.initFileName(form);

    pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
      const file: File = new File([blob], fileName);
      this.googleAuthService.handleAuthClick(file);
    });
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
