import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-examination-recommendation',
  templateUrl: './examination-recommendation.component.html',
  styleUrls: ['./examination-recommendation.component.scss'],
})
export class ExaminationRecommendationComponent implements OnInit {
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

  private createForm(): FormGroup {
    return new FormGroup({
      comments: new FormArray([]),
    });
  }
}
{
}
