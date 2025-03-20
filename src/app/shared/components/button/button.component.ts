import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-button',
  imports: [MatButton, TranslateModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input({ required: true }) translateKey: string;

  @Output() clickEvent: EventEmitter<void> = new EventEmitter<void>();

  public clickedEmitter(): void {
    this.clickEvent.emit();
  }
}
