import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReceiptComponent } from './receipt.component';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [
  { path: ':saleId', component: ReceiptComponent }
];

@NgModule({
  declarations: [ReceiptComponent],
  imports: [
    CommonModule,
    MatCardModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class ReceiptsModule { }
