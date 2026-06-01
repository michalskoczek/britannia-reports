import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cambridge-path-table',
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
  templateUrl: './cambridge-path-table.component.html',
  styleUrl: './cambridge-path-table.component.scss',
})
export class CambridgePathTableComponent {
  readonly formArray = input.required<FormArray>();

  readonly courses = input.required<string[]>();
  readonly languageLevels = input.required<string[]>();
  readonly certificationPurpose = input.required<string[]>();
  readonly schoolExams = input.required<string[]>();

  readonly displayedColumns: string[] = [
    'schoolYear',
    'classInSchool',
    'course',
    'courseLevel',
    'certificationPurpose',
    'schoolExam',
    'shouldDeleteRow',
  ];

  public getRowGroup(index: number): FormGroup {
    return this.formArray().at(index) as FormGroup;
  }

  public trackByIndex = (index: number): number => index;
}
