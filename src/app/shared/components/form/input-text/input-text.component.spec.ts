import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { InputTextComponent } from './input-text.component';
import { translateTestingImports } from '../../../testing/translate-testing';

describe('InputTextComponent', () => {
  let component: InputTextComponent;
  let fixture: ComponentFixture<InputTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputTextComponent, ...translateTestingImports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, InputTextComponent],
  template: `
    <form [formGroup]="form">
      <app-input-text formControlName="score" [type]="'number'"></app-input-text>
      <app-input-text formControlName="note" [type]="'text'"></app-input-text>
    </form>
  `,
})
class ValueTypeHostComponent {
  form = new FormGroup({
    score: new FormControl<unknown>(null),
    note: new FormControl<unknown>(null),
  });
}

/**
 * The template deliberately spells the number input out twice rather than binding `[type]`, because
 * Angular's `NumberValueAccessor` selector (`input[type=number][formControl]`) matches a static
 * attribute only. Collapsing the two branches back into one would silently downgrade every numeric
 * control to `DefaultValueAccessor` and start writing strings — which reaches the Cambridge PDF
 * through `GenerateTable.formatScore`, where `0` and `"0"` do not render the same. This spec is what
 * catches that.
 */
describe('InputTextComponent — value type by input type', () => {
  let fixture: ComponentFixture<ValueTypeHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValueTypeHostComponent, ...translateTestingImports],
    }).compileComponents();

    fixture = TestBed.createComponent(ValueTypeHostComponent);
    fixture.detectChanges();
  });

  it('writes a number for type="number" and a string for type="text"', () => {
    const [numberInput, textInput]: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );

    numberInput.value = '85';
    numberInput.dispatchEvent(new Event('input'));
    textInput.value = '85';
    textInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.score.value).toBe(85);
    expect(fixture.componentInstance.form.controls.note.value).toBe('85');
  });
});
