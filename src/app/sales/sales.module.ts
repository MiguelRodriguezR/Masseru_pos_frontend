import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleListComponent } from './sale-list/sale-list.component';
import { SaleDetailComponent } from './sale-detail/sale-detail.component';
import { RouterModule, Routes } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

const routes: Routes = [
  { path: '', component: SaleListComponent },
  { path: ':id', component: SaleDetailComponent }
];

@NgModule({
  declarations: [
    SaleListComponent,
    SaleDetailComponent
  ],
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    RouterModule.forChild(routes)
  ]
})
export class SalesModule { }
