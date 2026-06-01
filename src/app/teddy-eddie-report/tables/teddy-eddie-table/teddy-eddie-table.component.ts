import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-teddy-eddie-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    TranslateModule,
  ],
  templateUrl: './teddy-eddie-table.component.html',
  styleUrl: './teddy-eddie-table.component.scss',
})
export class TeddyEddieTableComponent {
  readonly formArray = input.required<FormArray>();

  readonly courses = input.required<string[]>();
  readonly courseLevels = input.required<string[]>();
  readonly books = input.required<string[]>();

  readonly displayedColumns: string[] = [
    'schoolYear',
    'studentsAge',
    'course',
    'courseLevel',
    'book',
    'shouldDeleteRow',
  ];

  public getRowGroup(index: number): FormGroup {
    return this.formArray().at(index) as FormGroup;
  }

  public trackByIndex = (index: number): number => index;
}
