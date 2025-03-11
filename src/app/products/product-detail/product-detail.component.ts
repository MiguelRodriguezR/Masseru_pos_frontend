import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../product.model';
import { ProductService } from '../product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product?: Product;
  loading: boolean = false;
  selectedImageIndex: number = 0;

  /**
   * Get the full URL for a product image
   * @param imagePath The image path or URL
   * @returns The full URL for the image
   */
  getImageUrl(imagePath: string): string {
    return this.productService.getImageUrl(imagePath);
  }

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProduct();
  }

  loadProduct(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if(id) {
      this.loading = true;
      this.productService.getProduct(id).subscribe({
        next: (data) => {
          this.product = data;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al cargar el producto', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  editProduct(): void {
    if (this.product?._id) {
      this.router.navigate(['/products/edit', this.product._id]);
    }
  }

  deleteProduct(): void {
    if (!this.product?._id) return;
    
    // Store the ID in a local variable to avoid TypeScript errors
    const productId = this.product._id;

    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Está seguro de eliminar este producto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.productService.deleteProduct(productId).subscribe({
          next: () => {
            Swal.fire(
              'Eliminado',
              'Producto eliminado con éxito',
              'success'
            );
            this.router.navigate(['/products']);
          },
          error: (err) => {
            console.error(err);
            Swal.fire(
              'Error',
              'Error al eliminar el producto',
              'error'
            );
            this.loading = false;
          }
        });
      }
    });
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  getProfitMargin(): number {
    if (!this.product) return 0;
    return this.product.salePrice - this.product.purchaseCost;
  }

  getProfitPercentage(): number {
    if (!this.product || this.product.purchaseCost === 0) return 0;
    return ((this.product.salePrice - this.product.purchaseCost) / this.product.purchaseCost) * 100;
  }
}
