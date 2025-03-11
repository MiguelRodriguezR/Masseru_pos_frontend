import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Sale, User } from '../sale.model';
import { SaleService } from '../sale.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sale-detail',
  templateUrl: './sale-detail.component.html',
  styleUrls: ['./sale-detail.component.scss']
})
export class SaleDetailComponent implements OnInit, OnDestroy {
  sale?: Sale;
  loading: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private saleService: SaleService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSaleDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSaleDetails(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if(id) {
      this.loading = true;
      this.saleService.getSale(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.sale = data;
            this.loading = false;
          },
          error: (err) => {
            console.error(err);
            this.snackBar.open('Error al cargar los detalles de la venta', 'Cerrar', { duration: 3000 });
            this.loading = false;
            this.router.navigate(['/sales']);
          }
        });
    }
  }

  goBack(): void {
    this.router.navigate(['/sales']);
  }

  generateReceipt(): void {
    if (!this.sale || !this.sale._id) return;
    
    Swal.fire({
      title: 'Generando recibo',
      text: 'El recibo se está generando...',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false
    });
    
    // Aquí se implementará la generación del recibo
    setTimeout(() => {
      Swal.fire({
        title: 'Recibo generado',
        text: 'El recibo se ha generado correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
    }, 1000);
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'cash':
        return 'Efectivo';
      case 'credit_card':
        return 'Tarjeta de crédito';
      default:
        return method;
    }
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isUserObject(user: User | string): user is User {
    return typeof user !== 'string' && user !== null && typeof user === 'object' && 'name' in user;
  }

  getUserName(user: User | string): string {
    if (this.isUserObject(user)) {
      return user.name || 'Usuario desconocido';
    }
    return 'Usuario desconocido';
  }

  getUserEmail(user: User | string): string {
    if (this.isUserObject(user)) {
      return user.email || 'Sin correo electrónico';
    }
    return 'Sin correo electrónico';
  }
}
