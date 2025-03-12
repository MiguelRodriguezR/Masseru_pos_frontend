import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaymentMethod } from '../payment-method.model';
import { PaymentMethodService } from '../payment-method.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payment-method-form',
  templateUrl: './payment-method-form.component.html',
  styleUrls: ['./payment-method-form.component.scss']
})
export class PaymentMethodFormComponent implements OnInit, OnDestroy {
  paymentMethodForm: FormGroup;
  isEditMode = false;
  paymentMethodId: string | null = null;
  loading = false;
  submitting = false;
  
  // Material icons for selection
  materialIcons: string[] = [
    'payments', 'credit_card', 'account_balance', 'attach_money',
    'money', 'payment', 'savings', 'currency_exchange', 'wallet',
    'account_balance_wallet', 'point_of_sale', 'receipt'
  ];
  
  // Default colors
  defaultColors: string[] = [
    'rgba(138, 107, 206, 0.8)', // Purple
    'rgba(33, 150, 243, 0.8)',  // Blue
    'rgba(76, 175, 80, 0.8)',   // Green
    'rgba(255, 152, 0, 0.8)',   // Orange
    'rgba(244, 67, 54, 0.8)',   // Red
    'rgba(233, 30, 99, 0.8)',   // Pink
    'rgba(0, 188, 212, 0.8)',   // Cyan
    'rgba(255, 87, 34, 0.8)'    // Deep Orange
  ];
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private fb: FormBuilder,
    private paymentMethodService: PaymentMethodService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.paymentMethodForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      code: ['', [Validators.required, Validators.maxLength(20)]],
      description: [''],
      color: ['rgba(138, 107, 206, 0.8)', Validators.required],
      icon: ['payments', Validators.required],
      isActive: [true]
    });
  }
  
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.paymentMethodId = params.get('id');
      
      if (this.paymentMethodId) {
        this.isEditMode = true;
        this.loadPaymentMethod(this.paymentMethodId);
      }
    });
  }
  
  loadPaymentMethod(id: string): void {
    this.loading = true;
    
    this.paymentMethodService.getPaymentMethodById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (paymentMethod) => {
          this.paymentMethodForm.patchValue({
            name: paymentMethod.name,
            code: paymentMethod.code,
            description: paymentMethod.description || '',
            color: paymentMethod.color,
            icon: paymentMethod.icon,
            isActive: paymentMethod.isActive
          });
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading payment method:', error);
          this.loading = false;
          this.showErrorAlert('Error al cargar el método de pago');
          this.router.navigate(['/payment-methods']);
        }
      });
  }
  
  onSubmit(): void {
    if (this.paymentMethodForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.paymentMethodForm.controls).forEach(key => {
        const control = this.paymentMethodForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.submitting = true;
    const paymentMethodData: PaymentMethod = this.paymentMethodForm.value;
    
    if (this.isEditMode && this.paymentMethodId) {
      // Update existing payment method
      this.paymentMethodService.updatePaymentMethod(this.paymentMethodId, paymentMethodData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.submitting = false;
            Swal.fire({
              title: 'Actualizado',
              text: 'Método de pago actualizado exitosamente',
              icon: 'success',
              timer: 1500
            }).then(() => {
              this.router.navigate(['/payment-methods']);
            });
          },
          error: (error) => {
            console.error('Error updating payment method:', error);
            this.submitting = false;
            this.showErrorAlert('Error al actualizar el método de pago');
          }
        });
    } else {
      // Create new payment method
      this.paymentMethodService.createPaymentMethod(paymentMethodData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.submitting = false;
            Swal.fire({
              title: 'Creado',
              text: 'Método de pago creado exitosamente',
              icon: 'success',
              timer: 1500
            }).then(() => {
              this.router.navigate(['/payment-methods']);
            });
          },
          error: (error) => {
            console.error('Error creating payment method:', error);
            this.submitting = false;
            this.showErrorAlert('Error al crear el método de pago');
          }
        });
    }
  }
  
  selectColor(color: string): void {
    this.paymentMethodForm.get('color')?.setValue(color);
  }
  
  selectIcon(icon: string): void {
    this.paymentMethodForm.get('icon')?.setValue(icon);
  }
  
  cancel(): void {
    this.router.navigate(['/payment-methods']);
  }
  
  showErrorAlert(message: string): void {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'OK'
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
