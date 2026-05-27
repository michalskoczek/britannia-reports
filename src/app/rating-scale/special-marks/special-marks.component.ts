import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// @ts-expect-error pdfmake
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-expect-error pdfFonts
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { MatError, MatFormField, MatHint, MatInput, MatLabel } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { NgIf } from '@angular/common';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatButton } from '@angular/material/button';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-special-marks',
  templateUrl: './special-marks.component.html',
  styleUrls: ['./special-marks.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    TranslateModule,
    MatHint,
    MatError,
    MatInput,
    NgIf,
    MatSelect,
    MatOption,
    MatButton,
  ],
})
export class SpecialMarksComponent implements OnInit {
  public specialMarksForm!: FormGroup;

  public readonly marks: { viewValue: string; value: string }[] = [
    { viewValue: '1', value: '1' },
    { viewValue: '2', value: '2' },
    { viewValue: '2+', value: '2+' },
    { viewValue: '3-', value: '3-' },
    { viewValue: '3', value: '3' },
    { viewValue: '3+', value: '3+' },
    { viewValue: '4-', value: '4-' },
    { viewValue: '4', value: '4' },
    { viewValue: '4+', value: '4+' },
    { viewValue: '5-', value: '5-' },
    { viewValue: '5', value: '5' },
    { viewValue: '6', value: '6' },
  ];

  ngOnInit(): void {
    this.specialMarksForm = this.createForm();
  }

  public generatePDF(form: FormGroup): any {
    const docDefinition = {
      content: [
        {
          style: 'tableExample',
          table: {
            body: [
              [
                {
                  rowSpan: 11,
                  text: 'Nasza skala ocen',
                  style: 'tableHeader',
                },
                {
                  text: '96-100%',
                },
                {
                  text: '5',
                },
                {
                  rowSpan: 11,
                  text:
                    'OCENA 6' +
                    'Ocena celująca przyznawana jest za osiągnięcia specjalne, w szczególności za wyróżniające się odpowiedzi ustne lub pisemne.',
                },
                {
                  rowSpan: 9,
                  text: 'Uzyskane oceny',
                  style: 'tableHeader',
                },
                {
                  rowSpan: 9,
                  text: `${form.value.marks}`,
                  style: 'tableHeader',
                },
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
                '',
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
                '',
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
          style: 'tableExample',
          table: {
            widths: ['*', 'auto'],
            body: [
              [{ text: 'Zaangażowanie i udział w lekcjach' }, { text: `${form.value.involvementInLessons}` }],
              [{ text: 'Prowadzenie zeszytu, notatek' }, { text: `${form.value.lead}` }],
              [{ text: 'Szacunek do nauczyciela i innych kursantów z grupy' }, { text: `${form.value.respect}` }],
              [{ text: 'Skupienie uwagi na lekcjach' }, { text: `${form.value.focus}` }],
              [{ text: 'Zachowanie' }, { text: `${form.value.behaviour}` }],
            ],
          },
        },
      ],
      styles: {
        tableHeader: {
          fontSize: 13,
          bold: true,
        },
        tableExample: {
          margin: [0, 5, 0, 15],
        },
      },
    };

    pdfMake.createPdf(docDefinition).open();
  }

  private createForm(): FormGroup {
    return new FormGroup({
      marks: new FormControl(null, Validators.required),
      avgMark: new FormControl(null, Validators.required),
      frequency: new FormControl(null, Validators.required),
      involvementInLessons: new FormControl(null, Validators.required),
      lead: new FormControl(null, Validators.required),
      respect: new FormControl(null, Validators.required),
      focus: new FormControl(null, Validators.required),
      behaviour: new FormControl(null, Validators.required),
    });
  }
}
