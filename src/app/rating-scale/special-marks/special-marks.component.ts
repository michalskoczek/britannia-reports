import { Component } from '@angular/core';

@Component({
  selector: 'app-special-marks',
  templateUrl: './special-marks.component.html',
  styleUrls: ['./special-marks.component.scss'],
})
export class SpecialMarksComponent {
  public readonly marks: string[] = [
    '1',
    '2',
    '2+',
    '3-',
    '3',
    '3+',
    '4-',
    '4',
    '4+',
    '5-',
    '5',
    '6',
  ];
}
