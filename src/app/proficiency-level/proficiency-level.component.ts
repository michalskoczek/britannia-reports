import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-proficiency-level',
  templateUrl: './proficiency-level.component.html',
  styleUrls: ['./proficiency-level.component.scss'],
})
export class ProficiencyLevelComponent implements OnInit {
  public commentsForm!: FormGroup;

  ngOnInit(): void {
    this.commentsForm = this.createForm();
  }

  get comments(): FormArray {
    return this.commentsForm.get('comments') as FormArray;
  }

  public addNextComment(): void {
    this.comments.push(new FormControl(null));
  }

  public generatePDF(form: FormGroup): any {
    let commentsArray: string[] = [];

    form.value.comments.forEach((comment: string) =>
      commentsArray.push(comment)
    );

    let docDefinition = {
      content: [
        { text: 'Komentarz', style: 'header' },
        {
          ul: commentsArray,
        },
      ],
      styles: {
        header: {
          bold: true,
          fontSize: 15,
        },
      },
      defaultStyle: {
        fontSize: 12,
      },
    };

    pdfMake.createPdf(docDefinition).open();
  }

  private createForm(): FormGroup {
    return new FormGroup({
      comments: new FormArray([]),
    });
  }
}
