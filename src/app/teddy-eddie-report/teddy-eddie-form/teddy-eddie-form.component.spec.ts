import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';

import { TeddyEddieFormComponent } from './teddy-eddie-form.component';
import { translateTestingImports } from '../../shared/testing/translate-testing';

describe('TeddyEddieFormComponent', () => {
  let component: TeddyEddieFormComponent;
  let fixture: ComponentFixture<TeddyEddieFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeddyEddieFormComponent, ...translateTestingImports],
      providers: [provideNoopAnimations(), provideNativeDateAdapter()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeddyEddieFormComponent);
    component = fixture.componentInstance;
    const fb = new FormBuilder();
    const form: FormGroup = fb.group({
      studentName: [''],
      age: [''],
      date: [null],
    });
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
