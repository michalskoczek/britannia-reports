import { Component, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-button',
  imports: [MatButton, TranslateModule, MatIcon],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  translateKey = input.required<string>();
  type = input<string>('text');
  icon = input<string>();

  clicked = output();

  public emitClicked(): void {
    this.clicked.emit();
  }
}
