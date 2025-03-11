import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { SaleService } from '../sale.service';
import { Sale, User } from '../sale.model';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sale-list',
  templateUrl: './sale-list.component.html',
  styleUrls: ['./sale-list.component.scss']
})
export class SaleListComponent implements OnInit, OnDestroy {
  sales: Sale[] = [];
  dataSource = new MatTableDataSource<Sale>([]);
  displayedColumns: string[] = ['saleDate', 'totalAmount', 'paymentMethod', 'user', 'actions'];
  loading: boolean = false;
  filterForm: FormGroup;
  
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private saleService: SaleService, 
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    // Inicializar formulario de filtros
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadSales();
  }

  ngAfterViewInit() {
    if (this.paginator && this.sort) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSales() {
    this.loading = true;
    const filters = this.filterForm.value;
    
    this.saleService.getSales(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sales = data;
          this.dataSource.data = data;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al cargar las ventas', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  applyFilter() {
    this.loadSales();
  }

  resetFilter() {
    this.filterForm.reset();
    this.loadSales();
  }

  viewSale(id: string) {
    this.router.navigate(['/sales', id]);
  }

  generateReceipt(id: string, event: Event) {
    event.stopPropagation();
    
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

  isUserObject(user: User | string): user is User {
    return typeof user !== 'string' && user !== null && typeof user === 'object' && 'name' in user;
  }

  getUserName(user: User | string): string {
    if (this.isUserObject(user)) {
      return user.name || 'Usuario desconocido';
    }
    return 'Usuario desconocido';
  }
}
