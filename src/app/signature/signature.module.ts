import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignatureComponent } from './signature.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [SignatureComponent],
  exports: [SignatureComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
  ],
})
export class SignatureModule {}
