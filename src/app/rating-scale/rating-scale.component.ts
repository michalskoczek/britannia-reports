import { Component } from '@angular/core';
import { ELEMENT_DATA, TableElement } from './table-elements';

@Component({
    selector: 'app-rating-scale',
    templateUrl: './rating-scale.component.html',
    styleUrls: ['./rating-scale.component.scss'],
    standalone: false
})
export class RatingScaleComponent {
  readonly displayedColumns: string[] = ['percent', 'mark'];
  readonly dataSource: TableElement[] = ELEMENT_DATA;
}
