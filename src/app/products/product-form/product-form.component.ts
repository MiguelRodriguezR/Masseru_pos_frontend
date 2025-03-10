import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ProductService } from '../product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../product.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEdit: boolean = false;
  productId?: string;
  imageFiles: File[] = [];
  imagePreviews: string[] = [];
  existingImages: string[] = [];
  keepImages: boolean = true;
  loading: boolean = false;
  @ViewChild('fileInput') fileInput!: ElementRef;

  /**
   * Get the full URL for a product image
   * @param imagePath The image path or URL
   * @returns The full URL for the image
   */
  getImageUrl(imagePath: string): string {
    return this.productService.getImageUrl(imagePath);
  }

  constructor(
    private fb: FormBuilder, 
    private productService: ProductService, 
    private router: Router, 
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.productForm = this.fb.group({
      salePrice: [0, [Validators.required, Validators.min(0)]],
      purchaseCost: [0, [Validators.required, Validators.min(0)]],
      barcode: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      quantity: [0, [Validators.required, Validators.min(0)]],
      variants: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || undefined;
    if(this.productId) {
      this.isEdit = true;
      this.loading = true;
      this.productService.getProduct(this.productId).subscribe({
        next: (product: Product) => {
          this.productForm.patchValue({
            salePrice: product.salePrice,
            purchaseCost: product.purchaseCost,
            barcode: product.barcode,
            name: product.name,
            description: product.description || '',
            quantity: product.quantity
          });
          
          if(product.images) {
            this.existingImages = [...product.images];
          }
          
          if(product.variants) {
            product.variants.forEach(variant => this.variants.push(this.fb.group({
              color: [variant.color, Validators.required],
              size: [variant.size, Validators.required],
              quantity: [variant.quantity, [Validators.required, Validators.min(0)]]
            })));
          }
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

  get variants(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }

  addVariant() {
    this.variants.push(this.fb.group({
      color: ['', Validators.required],
      size: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  removeVariant(index: number) {
    this.variants.removeAt(index);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      const totalImages = this.existingImages.length + this.imageFiles.length + files.length;
      
      if (totalImages > 5) {
        this.snackBar.open('Máximo 5 imágenes permitidas', 'Cerrar', { duration: 3000 });
        return;
      }
      
      for (const file of files) {
        if (file.type.match(/image\/*/) === null) {
          this.snackBar.open('Solo se permiten imágenes', 'Cerrar', { duration: 3000 });
          continue;
        }
        
        this.imageFiles.push(file);
        
        // Create image preview
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreviews.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
    // Reset file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  removeImagePreview(index: number) {
    this.imagePreviews.splice(index, 1);
    this.imageFiles.splice(index, 1);
  }

  removeExistingImage(index: number) {
    this.existingImages.splice(index, 1);
  }

  onSubmit() {
    if(this.productForm.valid) {
      this.loading = true;
      
      // Create a product object from form values
      const productData: Product = {
        salePrice: this.productForm.get('salePrice')?.value,
        purchaseCost: this.productForm.get('purchaseCost')?.value,
        barcode: this.productForm.get('barcode')?.value,
        name: this.productForm.get('name')?.value,
        description: this.productForm.get('description')?.value || '',
        quantity: this.productForm.get('quantity')?.value,
        variants: this.productForm.get('variants')?.value || [],
        images: [] // This will be handled by the server
      };
      
      if (this.isEdit && this.productId) {
        // Use the new updateProductWithJSON method
        this.productService.updateProductWithJSON(
          this.productId, 
          productData, 
          this.imageFiles, 
          this.keepImages
        ).subscribe({
          next: () => {
            this.snackBar.open('Producto actualizado con éxito', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/products']);
          },
          error: (err) => {
            console.error(err);
            this.snackBar.open('Error al actualizar el producto: ' + (err.error?.error || 'Error desconocido'), 'Cerrar', { duration: 5000 });
            this.loading = false;
          }
        });
      } else {
        // Use the new createProductWithJSON method
        this.productService.createProductWithJSON(
          productData, 
          this.imageFiles
        ).subscribe({
          next: () => {
            this.snackBar.open('Producto creado con éxito', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/products']);
          },
          error: (err) => {
            console.error(err);
            this.snackBar.open('Error al crear el producto: ' + (err.error?.error || 'Error desconocido'), 'Cerrar', { duration: 5000 });
            this.loading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.productForm);
      this.snackBar.open('Por favor, complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
    }
  }

  // Helper method to mark all controls as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
