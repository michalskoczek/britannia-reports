import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-basic-questions',
  templateUrl: './basic-questions.component.html',
  styleUrls: ['./basic-questions.component.scss'],
})
export class BasicQuestionsComponent implements OnInit {
  public basicForm!: FormGroup;

  ngOnInit(): void {
    this.basicForm = this.createForm();
  }

  private createForm(): FormGroup {
    return new FormGroup({
      studentName: new FormControl(null, Validators.required),
      date: new FormControl(null, Validators.required),
      class: new FormControl(4),
      instructor: new FormControl(null, Validators.required),
      studentBookTitle: new FormControl(null, Validators.required),
      course: new FormControl(null, Validators.required),
      realizedMaterial: new FormControl(null, Validators.required),
    });
  }
}
