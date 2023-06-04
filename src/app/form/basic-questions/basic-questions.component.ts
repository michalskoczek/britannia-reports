import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { DatePipe } from '@angular/common';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-basic-questions',
  templateUrl: './basic-questions.component.html',
  styleUrls: ['./basic-questions.component.scss'],
})
export class BasicQuestionsComponent implements OnInit {
  public basicForm!: FormGroup;

  public readonly classes: string[] = [
    'Klasa 2 szkoły podstawowej',
    'Klasa 3 szkoły podstawowej',
    'Klasa 4 szkoły podstawowej',
    'Klasa 5 szkoły podstawowej',
    'Klasa 6 szkoły podstawowej',
    'Klasa 7 szkoły podstawowej',
    'Klasa 8 szkoły podstawowej',
    'Klasa 1 szkoły średniej',
    'Klasa 2 szkoły średniej',
    'Klasa 3 szkoły średniej',
    'Klasa 4 szkoły średniej',
    'osoba dorosła',
  ];

  public readonly teachers: string[] = [
    'Regina Raczyńska',
    'Adam Sikorski',
    'Dorota Kot',
    'Aleksandra Mierzejewska',
    'Jolanta Rybak',
  ];

  public readonly books: string[] = [
    'Kid’s Box 1, wydawnictwo Cambridge',
    'Kid’s Box 2, wydawnictwo Cambridge',
    'Kid’s Box 3, wydawnictwo Cambridge',
    'Kid’s Box 4, wydawnictwo Cambridge',
    'Kid’s Box 5, wydawnictwo Cambridge',
    'Kid’s Box 6, wydawnictwo Cambridge',
    'Team Together 5, wydawnictwo Pearson',
    'Team Together 6, wydawnictwo Pearson',
  ];

  public readonly courses: string[] = [
    'English Pearls 2 / Pre-A1.1',
    'English Pearls 3 / Pre-A1.2',
    'English Amethysts 4 / A1.1',
    'English Amethysts 5 / A1.2',
    'English Emeralds 6 / A2.1',
    'English Emeralds 7 / A2.2',
    'English Rubies / B1.1',
    'English Rubies / B1.2',
    'English Saphires / B2.1',
    'English Saphires / B2.2',
    'English Diamonds / C1.1',
    'English Diamonds / C1.2',
  ];

  constructor(private _datePipe: DatePipe) {}

  ngOnInit(): void {
    this.basicForm = this.createForm();
  }

  public generatePDF(form: FormGroup): any {
    console.log(form.value, form.value.teacher);

    let date = new Date(form.value.date).toLocaleDateString();

    let docDefinition = {
      header: 'PODSUMOWANIE NAUKI i DALSZE REKOMENDACJE',
      content: [
        `Imię i Nazwisko ucznia: ${form.value.studentName}`,
        {
          style: 'tableExample',
          table: {
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
                { text: `${form.value.studentBookTitle}` },
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
      ],
      styles: {
        tableHeader: {
          fontSize: 13,
          bold: true,
        },
      },
    };

    console.log(docDefinition.content);

    pdfMake.createPdf(docDefinition);
  }

  private createForm(): FormGroup {
    return new FormGroup({
      studentName: new FormControl(null, Validators.required),
      date: new FormControl(null, Validators.required),
      class: new FormControl(null, Validators.required),
      teacher: new FormControl(null, Validators.required),
      studentBookTitle: new FormControl(null, Validators.required),
      course: new FormControl(null, Validators.required),
      realizedMaterial: new FormControl(null, Validators.required),
    });
  }
}
