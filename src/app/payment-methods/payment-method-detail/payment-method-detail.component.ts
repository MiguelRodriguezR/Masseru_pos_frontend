import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaymentMethod } from '../payment-method.model';
import { PaymentMethodService } from '../payment-method.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payment-method-detail',
  templateUrl: './payment-method-detail.component.html',
  styleUrls: ['./payment-method-detail.component.scss']
})
export class PaymentMethodDetailComponent implements OnInit, OnDestroy {
  paymentMethod: PaymentMethod | null = null;
  loading = true;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private paymentMethodService: PaymentMethodService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadPaymentMethod(id);
      } else {
        this.router.navigate(['/payment-methods']);
      }
    });
  }
  
  loadPaymentMethod(id: string): void {
    this.loading = true;
    
    this.paymentMethodService.getPaymentMethodById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (paymentMethod) => {
          this.paymentMethod = paymentMethod;
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
  
  editPaymentMethod(): void {
    if (this.paymentMethod?._id) {
      this.router.navigate([`/payment-methods/${this.paymentMethod._id}/edit`]);
    }
  }
  
  deletePaymentMethod(): void {
    if (!this.paymentMethod?._id) return;
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el método de pago "${this.paymentMethod.name}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.paymentMethodService.deletePaymentMethod(this.paymentMethod!._id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              Swal.fire({
                title: 'Eliminado',
                text: 'Método de pago eliminado exitosamente',
                icon: 'success',
                timer: 1500
              }).then(() => {
                this.router.navigate(['/payment-methods']);
              });
            },
            error: (error) => {
              console.error('Error eliminando método de pago:', error);
              this.showErrorAlert('Error al eliminar el método de pago');
            }
          });
      }
    });
  }
  
  toggleStatus(): void {
    if (!this.paymentMethod?._id) return;
    
    const newStatus = !this.paymentMethod.isActive;
    const statusText = newStatus ? 'activar' : 'desactivar';
    
    Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${statusText} el método de pago "${this.paymentMethod.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.paymentMethodService.togglePaymentMethodStatus(this.paymentMethod!._id!, newStatus)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              // Update the local data
              this.paymentMethod!.isActive = newStatus;
              
              Swal.fire({
                title: 'Actualizado',
                text: `Método de pago ${statusText}do exitosamente`,
                icon: 'success',
                timer: 1500
              });
            },
            error: (error) => {
              console.error(`Error ${statusText}ndo método de pago:`, error);
              this.showErrorAlert(`Error al ${statusText} el método de pago`);
            }
          });
      }
    });
  }
  
  goBack(): void {
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
