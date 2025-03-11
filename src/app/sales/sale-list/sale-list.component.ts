import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { SaleService, PaginatedSales, SaleFilters } from '../sale.service';
import { Sale, User } from '../sale.model';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SalesFilterService } from '../sales-filter.service';
import { ReceiptService } from '../../receipts/receipt.service';

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
    private snackBar: MatSnackBar,
    private salesFilterService: SalesFilterService,
    private receiptService: ReceiptService
  ) {
    // Inicializar formulario de filtros
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    // Restaurar filtros guardados
    this.restoreFilters();
    
    // Cargar ventas con los filtros restaurados
    this.loadSales();
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.paginator.page.pipe(
        takeUntil(this.destroy$)
      ).subscribe((event: PageEvent) => {
        // Actualizar el tamaño de página en el servicio de filtros
        this.salesFilterService.pageSize = event.pageSize;
        this.salesFilterService.currentPage = event.pageIndex + 1;
        
        // Cargar ventas con la nueva página y tamaño
        this.loadSales(event.pageIndex + 1, event.pageSize);
      });
    }
    
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Restaura los filtros guardados en el servicio
   */
  private restoreFilters(): void {
    // Restaurar valores del formulario
    const formValues = this.salesFilterService.formValues;
    if (formValues) {
      this.filterForm.patchValue(formValues);
    }
    
    // Restaurar término de búsqueda
    this.searchTerm = this.salesFilterService.searchTerm;
    
    // Restaurar opciones de filtro
    this.filterOptions = [...this.salesFilterService.filterOptions];
    
    // Restaurar paginación
    this.currentPage = this.salesFilterService.currentPage;
    this.pageSize = this.salesFilterService.pageSize;
  }
  
  /**
   * Guarda los filtros actuales en el servicio
   */
  private saveFilters(filters: SaleFilters): void {
    // Guardar filtros
    this.salesFilterService.saveFilters(filters);
    
    // Guardar valores del formulario
    this.salesFilterService.saveFormValues(this.filterForm.value);
    
    // Guardar término de búsqueda
    this.salesFilterService.searchTerm = this.searchTerm;
    
    // Guardar opciones de filtro
    this.salesFilterService.filterOptions = [...this.filterOptions];
    
    // Guardar paginación
    this.salesFilterService.currentPage = this.currentPage;
    this.salesFilterService.pageSize = this.pageSize;
  }

  // Paginación
  totalSales: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 100];
  
  // Filtros adicionales
  searchTerm: string = '';
  filterOptions: { value: string, label: string, selected: boolean }[] = [
    { value: 'productName', label: 'Nombre de producto', selected: true },
    { value: 'productBarcode', label: 'Código de barras', selected: false },
    { value: 'totalAmount', label: 'Valor total', selected: false }
  ];

  loadSales(page: number = this.currentPage, limit: number = this.pageSize) {
    this.loading = true;
    
    // Construir objeto de filtros
    const filters: SaleFilters = {
      ...this.filterForm.value,
      page,
      limit
    };
    
    // Agregar filtro de búsqueda si existe
    if (this.searchTerm) {
      filters.search = this.searchTerm;
      
      // Agregar opciones de filtro seleccionadas
      filters.filterBy = this.filterOptions
        .filter(option => option.selected)
        .map(option => option.value);
    }
    
    // Guardar los filtros actuales
    this.saveFilters(filters);
    
    this.saleService.getSales(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('API Response:', response); // Depuración
          
          if (response && response.sales) {
            this.sales = response.sales;
            this.dataSource.data = response.sales;
            
            if (response.pagination) {
              this.totalSales = response.pagination.total;
              this.currentPage = response.pagination.page;
              this.pageSize = response.pagination.limit;
              
              // Actualizar paginador
              if (this.paginator) {
                this.paginator.length = response.pagination.total;
                this.paginator.pageIndex = response.pagination.page - 1;
                this.paginator.pageSize = response.pagination.limit;
              }
            }
          } else {
            // Si la respuesta no tiene la estructura esperada, puede ser que el API
            // esté devolviendo un array directamente en lugar de un objeto paginado
            if (Array.isArray(response)) {
              this.sales = response;
              this.dataSource.data = response;
              this.totalSales = response.length;
              
              // Actualizar paginador
              if (this.paginator) {
                this.paginator.length = response.length;
                this.paginator.pageIndex = 0;
              }
            } else {
              this.sales = [];
              this.dataSource.data = [];
              this.totalSales = 0;
            }
          }
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading sales:', err);
          this.snackBar.open('Error al cargar las ventas', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  applyFilter() {
    // Resetear a la primera página al aplicar filtros
    this.currentPage = 1;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadSales(1, this.pageSize);
  }

  resetFilter() {
    this.filterForm.reset();
    this.searchTerm = '';
    this.filterOptions = [
      { value: 'productName', label: 'Nombre de producto', selected: true },
      { value: 'productBarcode', label: 'Código de barras', selected: false },
      { value: 'totalAmount', label: 'Valor total', selected: false }
    ];
    this.currentPage = 1;
    this.pageSize = 10;
    
    // Resetear paginador
    if (this.paginator) {
      this.paginator.pageIndex = 0;
      this.paginator.pageSize = 10;
    }
    
    // Resetear filtros en el servicio
    this.salesFilterService.resetFilters();
    
    this.loadSales(1, 10);
  }

  viewSale(id: string) {
    this.router.navigate(['/sales', id]);
  }

  generateReceipt(id: string, event: Event) {
    event.stopPropagation();
    
    this.receiptService.generateReceipt(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
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
