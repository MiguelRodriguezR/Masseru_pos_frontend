import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ProductService, PaginatedProducts } from '../product.service';
import { Product } from '../product.model';
import { Router } from '@angular/router';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  displayedColumns: string[] = ['image', 'name', 'barcode', 'salePrice', 'quantity', 'actions'];
  loading: boolean = false;
  searchTerm: string = '';
  
  // Pagination variables
  totalProducts: number = 0;
  currentPage: number = 1;
  pageSize: number = 5;
  pageSizeOptions: number[] = [5, 10, 25, 100];
  
  // Subject for unsubscribing observables
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService, 
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProducts(this.currentPage, this.pageSize);
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
        console.log('Paginator initialized:', this.paginator);
        this.paginator.page.pipe(
          takeUntil(this.destroy$)
        ).subscribe((event: PageEvent) => {
          console.log('Paginator event:', event);
          this.currentPage = event.pageIndex + 1;
          this.pageSize = event.pageSize;
          console.log('Loading products with page:', this.currentPage, 'size:', this.pageSize);
          this.loadProducts(this.currentPage, this.pageSize);
        });
      } else {
        console.error('Paginator not initialized');
      }
    });
  }

  loadProducts(page: number = 1, limit: number = 10) {
    // console.log('loadProducts called with page:', page, 'limit:', limit);
    this.loading = true;
    this.productService.getProducts(page, limit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedProducts) => {
          // console.log('API response:', response);
          this.products = response.products;
          this.totalProducts = response.pagination.total;
          this.loading = false;
          
          // Update paginator
          if (this.paginator) {
            // console.log('Updating paginator with:', response.pagination);
            this.paginator.length = response.pagination.total;
            this.paginator.pageIndex = response.pagination.page - 1;
            this.paginator.pageSize = response.pagination.limit;
          } else {
            // console.error('Paginator not available when updating');
          }
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al cargar los productos', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    
    // For now, just do client-side filtering on the current page
    // TODO: Implement server-side filtering in the future
    
    // Reset to first page when filtering
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  viewProduct(id: string) {
    this.router.navigate(['/products', id]);
  }

  editProduct(id: string) {
    this.router.navigate(['/products/edit', id]);
  }

  deleteProduct(id: string, event: Event) {
    event.stopPropagation();
    
    const confirmDelete = window.confirm('¿Está seguro de eliminar este producto?');
    
    if (confirmDelete) {
      this.loading = true;
      this.productService.deleteProduct(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Producto eliminado con éxito', 'Cerrar', { duration: 3000 });
            this.loadProducts(this.currentPage, this.pageSize);
          },
          error: (err) => {
            console.error(err);
            this.snackBar.open('Error al eliminar el producto', 'Cerrar', { duration: 3000 });
            this.loading = false;
          }
        });
    }
  }

  getProductImage(product: Product): string {
    if (product.images && product.images.length > 0) {
      // Check if the image path is already a full URL
      if (product.images[0].startsWith('http')) {
        return product.images[0];
      } else {
        // Otherwise, prepend the baseUrl
        return this.productService.getImageUrl(product.images[0]);
      }
    }
    return '';
  }
}
