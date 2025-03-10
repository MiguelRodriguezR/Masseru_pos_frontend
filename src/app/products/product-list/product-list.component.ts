import { Component, OnInit, ViewChild } from '@angular/core';
import { ProductService } from '../product.service';
import { Product } from '../product.model';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  dataSource: MatTableDataSource<Product> = new MatTableDataSource<Product>([]);
  displayedColumns: string[] = ['image', 'name', 'barcode', 'salePrice', 'quantity', 'actions'];
  loading: boolean = false;
  searchTerm: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService, 
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadProducts() {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Error al cargar los productos', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
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
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.snackBar.open('Producto eliminado con éxito', 'Cerrar', { duration: 3000 });
          this.loadProducts();
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
