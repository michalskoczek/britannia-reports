import { Component } from '@angular/core';
import { ELEMENT_DATA, TableElement } from './table-elements';
import {TranslateModule} from '@ngx-translate/core';
import {MatCell, MatColumnDef, MatHeaderCell, MatHeaderRow, MatRow, MatTable} from '@angular/material/table';
import {SpecialMarksComponent} from './special-marks/special-marks.component';

@Component({
  selector: 'app-rating-scale',
  templateUrl: './rating-scale.component.html',
  styleUrls: ['./rating-scale.component.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatRow,
    SpecialMarksComponent,
  ],
})
export class RatingScaleComponent {
  readonly displayedColumns: string[] = ['percent', 'mark'];
  readonly dataSource: TableElement[] = ELEMENT_DATA;
}
