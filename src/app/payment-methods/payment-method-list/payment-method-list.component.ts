import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaymentMethod } from '../payment-method.model';
import { PaymentMethodService } from '../payment-method.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payment-method-list',
  templateUrl: './payment-method-list.component.html',
  styleUrls: ['./payment-method-list.component.scss']
})
export class PaymentMethodListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['name', 'code', 'color', 'isActive', 'actions'];
  dataSource = new MatTableDataSource<PaymentMethod>([]);
  loading = true;
  totalPaymentMethods = 0;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private paymentMethodService: PaymentMethodService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadPaymentMethods();
  }
  
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  loadPaymentMethods(): void {
    this.loading = true;
    
    this.paymentMethodService.getPaymentMethods()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.paymentMethods;
          this.totalPaymentMethods = response.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading payment methods:', error);
          this.loading = false;
          this.showErrorAlert('Error al cargar los métodos de pago');
        }
      });
  }
  
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  createPaymentMethod(): void {
    this.router.navigate(['/payment-methods/new']);
  }
  
  editPaymentMethod(id: string): void {
    this.router.navigate([`/payment-methods/${id}/edit`]);
  }
  
  viewPaymentMethod(id: string): void {
    this.router.navigate([`/payment-methods/${id}`]);
  }
  
  toggleStatus(paymentMethod: PaymentMethod): void {
    if (!paymentMethod._id) return;
    
    const newStatus = !paymentMethod.isActive;
    const statusText = newStatus ? 'activar' : 'desactivar';
    
    Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${statusText} el método de pago "${paymentMethod.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.paymentMethodService.togglePaymentMethodStatus(paymentMethod._id!, newStatus)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              // Update the local data
              paymentMethod.isActive = newStatus;
              
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
  
  deletePaymentMethod(paymentMethod: PaymentMethod): void {
    if (!paymentMethod._id) return;
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el método de pago "${paymentMethod.name}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.paymentMethodService.deletePaymentMethod(paymentMethod._id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              // Remove from the local data
              this.dataSource.data = this.dataSource.data.filter(p => p._id !== paymentMethod._id);
              
              Swal.fire({
                title: 'Eliminado',
                text: 'Método de pago eliminado exitosamente',
                icon: 'success',
                timer: 1500
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
