import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-signature',
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.scss'],
})
export class SignatureComponent implements OnInit {
  public signatureForm!: FormGroup;

  ngOnInit(): void {
    this.signatureForm = this.createForm();
  }

  public generatePDF(form: FormGroup): any {
    let docDefinition = {
      content: [{ text: form.value.signature }],
      styles: {
        header: {
          bold: true,
          fontSize: 14,
        },
      },
      defaultStyle: {
        fontSize: 11,
      },
    };

    pdfMake.createPdf(docDefinition).open();
  }

  private createForm(): FormGroup {
    return new FormGroup({
      signature: new FormControl(null, Validators.required),
    });
  }
}
