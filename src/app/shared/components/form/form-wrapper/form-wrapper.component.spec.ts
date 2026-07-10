import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormWrapperComponent } from './form-wrapper.component';
import { translateTestingImports } from '../../../testing/translate-testing';

describe('FormWrapperComponent', () => {
  let component: FormWrapperComponent;
  let fixture: ComponentFixture<FormWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormWrapperComponent, ...translateTestingImports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
