import { Component, OnInit, ViewChild, OnDestroy, ElementRef, ViewContainerRef, EnvironmentInjector, ComponentRef } from '@angular/core'; // Added ViewContainerRef, EnvironmentInjector, ComponentRef
import { PurchaseService, PaginatedPurchases } from '../purchase.service';
import { Purchase } from '../purchase.model';
import { PurchaseCsvUploadComponent } from '../purchase-csv-upload/purchase-csv-upload.component'; // Import the upload component
import { Router } from '@angular/router';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-list',
  templateUrl: './purchase-list.component.html',
  styleUrls: ['./purchase-list.component.scss']
})
export class PurchaseListComponent implements OnInit, OnDestroy {
  purchases: Purchase[] = [];
  displayedColumns: string[] = ['invoiceNumber', 'supplier', 'total', 'createdAt', 'actions'];
  loading: boolean = false;
  searchTerm: string = '';
  
  // Pagination variables
  totalPurchases: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 100];
  
  // Subject for unsubscribing observables
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('searchInput') searchInput!: ElementRef;

  constructor(
    private purchaseService: PurchaseService,
    private router: Router,
    private snackBar: MatSnackBar,
    private viewContainerRef: ViewContainerRef, // Inject ViewContainerRef
    private environmentInjector: EnvironmentInjector // Inject EnvironmentInjector
  ) {}

  private csvUploadComponentRef: ComponentRef<PurchaseCsvUploadComponent> | null = null; // To hold the component reference

  ngOnInit(): void {
    this.loadPurchases(this.currentPage, this.pageSize);
    
    // Setup search debouncer
    this.searchSubject.pipe(
      debounceTime(400), // Wait for 400ms after the last event before emitting
      distinctUntilChanged(), // Only emit if value is different from previous
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.currentPage = 1;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadPurchases(1, this.pageSize, searchTerm);
    });
  }
  
  ngOnDestroy(): void {
    // Unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    // Configure paginator
    setTimeout(() => {
      if (this.paginator) {
        this.paginator.page.pipe(
          takeUntil(this.destroy$)
        ).subscribe((event: PageEvent) => {
          this.currentPage = event.pageIndex + 1;
          this.pageSize = event.pageSize;
          this.loadPurchases(this.currentPage, this.pageSize);
        });
      }
    });
  }

  loadPurchases(page: number = 1, limit: number = 10, search: string = this.searchTerm) {
    this.loading = true;
    this.purchaseService.getPurchases(page, limit, search)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedPurchases) => {
          this.purchases = response.purchases;
          this.totalPurchases = response.pagination.total;
          this.loading = false;
          
          // Update paginator
          if (this.paginator) {
            this.paginator.length = response.pagination.total;
            this.paginator.pageIndex = response.pagination.page - 1;
            this.paginator.pageSize = response.pagination.limit;
          }
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al cargar las compras', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim();
    this.searchTerm = filterValue;
    
    // Push to the search subject, which will debounce and then trigger the search
    this.searchSubject.next(filterValue);
  }

  viewPurchase(id: string) {
    this.router.navigate(['/purchases', id]);
  }

  editPurchase(id: string, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/purchases/edit', id]);
  }

  deletePurchase(id: string, event: Event) {
    event.stopPropagation();
    
    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Está seguro de eliminar esta compra?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.purchaseService.deletePurchase(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire(
                'Eliminada',
                'Compra eliminada con éxito',
                'success'
              );
              this.loadPurchases(this.currentPage, this.pageSize);
            },
            error: (err) => {
              console.error(err);
              Swal.fire(
                'Error',
                'Error al eliminar la compra',
                'error'
              );
              this.loading = false;
            }
          });
      }
    });
  }

  // Format date to a readable format
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  openCsvUploadModal(): void {
    Swal.fire({
      title: 'Subir Archivo CSV de Compras',
      text: 'Seleccione un archivo CSV con el formato correcto.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Procesar',
      cancelButtonText: 'Cancelar',
      html: '<div id="csv-upload-container"></div>',
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      didOpen: (modalElement) => {
        // Find the placeholder
        const container = modalElement.querySelector('#csv-upload-container');
        if (container) {
          // Create the component
          this.csvUploadComponentRef = this.viewContainerRef.createComponent(PurchaseCsvUploadComponent, {
            environmentInjector: this.environmentInjector
          });
          // Attach the component's DOM element to the placeholder
          container.appendChild(this.csvUploadComponentRef.location.nativeElement);
        } else {
          console.error('CSV Upload container not found in SweetAlert modal');
        }
      },
      preConfirm: async () => {
        // Get the selected file from the component instance before confirming
        if (this.csvUploadComponentRef?.instance) {
          const instance = this.csvUploadComponentRef.instance;
          
          if (!instance.selectedFile) {
            Swal.showValidationMessage('Por favor seleccione un archivo CSV');
            return false;
          }
          
          try {
            // Process the file and return the result
            return await instance.processFile();
          } catch (error) {
            console.error('Error processing CSV file:', error);
            Swal.showValidationMessage(`Error al procesar el archivo: ${error}`);
            return false;
          }
        }
        
        Swal.showValidationMessage('Error al inicializar el componente de carga');
        return false;
      },
      willClose: () => {
        // Destroy the component when the modal closes
        if (this.csvUploadComponentRef) {
          this.csvUploadComponentRef.destroy();
          this.csvUploadComponentRef = null;
        }
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const processResult = result.value as {success: number, errors: number};
        
        if (processResult.success > 0 || processResult.errors > 0) {
          let message = `Se procesaron ${processResult.success} productos correctamente.`;
          if (processResult.errors > 0) {
            message += ` Hubo ${processResult.errors} errores durante el proceso.`;
          }
          
          Swal.fire({
            title: 'Procesamiento Completado',
            html: message,
            icon: processResult.errors > 0 ? 'warning' : 'success',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            // Reload the purchases list to show the new purchases
            this.loadPurchases(this.currentPage, this.pageSize);
          });
        } else {
          Swal.fire('Información', 'No se procesó ningún producto.', 'info');
        }
      }
    });
  }
}
