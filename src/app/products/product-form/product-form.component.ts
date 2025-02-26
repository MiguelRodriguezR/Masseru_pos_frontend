import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ProductService } from '../product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../product.model';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEdit: boolean = false;
  productId?: string;

  constructor(private fb: FormBuilder, private productService: ProductService, private router: Router, private route: ActivatedRoute) {
    this.productForm = this.fb.group({
      salePrice: [0, Validators.required],
      purchaseCost: [0, Validators.required],
      barcode: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      images: this.fb.array([]),
      quantity: [0, Validators.required],
      variants: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || undefined;
    if(this.productId) {
      this.isEdit = true;
      this.productService.getProduct(this.productId).subscribe({
        next: (product: Product) => {
          this.productForm.patchValue(product);
          if(product.images) {
            product.images.forEach(image => this.images.push(this.fb.control(image)));
          }
          if(product.variants) {
            product.variants.forEach(variant => this.variants.push(this.fb.group({
              color: [variant.color, Validators.required],
              size: [variant.size, Validators.required],
              quantity: [variant.quantity, Validators.required]
            })));
          }
        },
        error: (err) => console.error(err)
      });
    }
  }

  get images(): FormArray {
    return this.productForm.get('images') as FormArray;
  }

  addImage() {
    this.images.push(this.fb.control(''));
  }

  removeImage(index: number) {
    this.images.removeAt(index);
  }

  get variants(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }

  addVariant() {
    this.variants.push(this.fb.group({
      color: ['', Validators.required],
      size: ['', Validators.required],
      quantity: [0, Validators.required]
    }));
  }

  removeVariant(index: number) {
    this.variants.removeAt(index);
  }

  onSubmit() {
    if(this.productForm.valid) {
      if(this.isEdit && this.productId) {
        this.productService.updateProduct(this.productId, this.productForm.value).subscribe({
          next: () => this.router.navigate(['/products']),
          error: (err) => console.error(err)
        });
      } else {
        this.productService.createProduct(this.productForm.value).subscribe({
          next: () => this.router.navigate(['/products']),
          error: (err) => console.error(err)
        });
      }
    }
  }
}
