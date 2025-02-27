import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosComponent } from './pos.component';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { FilterPipe } from './filter.pipe';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [
  { path: '', component: PosComponent }
];

@NgModule({
  declarations: [PosComponent, FilterPipe],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatTableModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class PosModule { }
