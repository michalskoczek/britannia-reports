import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

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

  private createForm(): FormGroup {
    return new FormGroup({
      comments: new FormArray([]),
    });
  }
}
