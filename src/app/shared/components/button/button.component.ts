import { Component, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

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
  disabled = input<boolean>(false);

  /**
   * `primary` is the page's main action (dark fill). `secondary` is a repeated in-form action such as
   * adding a row — deliberately lower emphasis so it does not compete with the submit button.
   * `danger` is destructive (remove a row).
   */
  variant = input<ButtonVariant>('primary');

  clicked = output();

  public emitClicked(): void {
    this.clicked.emit();
  }
}
