import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosComponent } from './pos.component';
import { PosSessionComponent } from './pos-session/pos-session.component';
import { PaymentComponent } from './payment/payment.component';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { FilterPipe } from './filter.pipe';
import { SharedModule } from '../shared/shared.module';
import { PosSessionService } from './pos-session.service';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { PaymentMethodService } from '../payment-methods/payment-method.service';

const routes: Routes = [
  { path: '', component: PosComponent },
  { path: 'session/:id', component: PosSessionComponent },
  { path: 'payment/:sessionId', component: PaymentComponent }
];

@NgModule({
  declarations: [
    PosComponent, 
    PosSessionComponent, 
    PaymentComponent,
    FilterPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatBadgeModule,
    MatDialogModule,
    MatTableModule,
    MatProgressSpinnerModule,
    RouterModule.forChild(routes),
    SharedModule,
    SweetAlert2Module.forRoot()
  ],
  providers: [PosSessionService, PaymentMethodService]
})
export class PosModule { }
