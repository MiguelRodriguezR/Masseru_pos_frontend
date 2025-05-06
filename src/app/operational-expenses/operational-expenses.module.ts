import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';

// Components
import { OperationalExpenseListComponent } from './operational-expense-list/operational-expense-list.component';
import { OperationalExpenseDetailComponent } from './operational-expense-detail/operational-expense-detail.component';
import { OperationalExpenseFormComponent } from './operational-expense-form/operational-expense-form.component';

// Angular Material Modules
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';

const routes: Routes = [
  { path: '', component: OperationalExpenseListComponent },
  { path: 'new', component: OperationalExpenseFormComponent },
  { path: ':id', component: OperationalExpenseDetailComponent },
  { path: 'edit/:id', component: OperationalExpenseFormComponent }
];

@NgModule({
  declarations: [
    OperationalExpenseListComponent,
    OperationalExpenseDetailComponent,
    OperationalExpenseFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    
    // Angular Material
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatCardModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatListModule,
    MatExpansionModule,
    MatChipsModule
  ]
})
export class OperationalExpensesModule { }
