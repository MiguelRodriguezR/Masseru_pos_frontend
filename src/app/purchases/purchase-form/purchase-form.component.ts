import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseService } from '../purchase.service';
import { ProductService } from '../../products/product.service';
import { Purchase, PurchaseItem } from '../purchase.model';
import { Product } from '../../products/product.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject, of } from 'rxjs';
import { takeUntil, startWith, map, debounceTime, switchMap, catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-form',
  templateUrl: './purchase-form.component.html',
  styleUrls: ['./purchase-form.component.scss']
})
export class PurchaseFormComponent implements OnInit, OnDestroy {
  purchaseForm: FormGroup;
  isEdit: boolean = false;
  purchaseId: string = '';
  loading: boolean = false;
  filteredProducts: Observable<Product[]>[] = [];
  allProducts: Product[] = [];
  
  // Subject for unsubscribing observables
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.purchaseForm = this.fb.group({
      items: this.fb.array([]),
      supplier: [''],
      invoiceNumber: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    
    this.purchaseId = this.route.snapshot.paramMap.get('id') || '';
    if (this.purchaseId) {
      this.isEdit = true;
      this.loadPurchase();
    } else {
      // Add at least one item row for new purchases
      this.addItem();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get items(): FormArray {
    return this.purchaseForm.get('items') as FormArray;
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts(1, 1000) // Get all products with a high limit
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allProducts = response.products;
          this.loading = false;
          
          // Update filtered products for existing items
          this.updateFilteredProducts();
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al cargar los productos', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  loadPurchase(): void {
    this.loading = true;
    this.purchaseService.getPurchase(this.purchaseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (purchase: Purchase) => {
          // Patch basic info
          this.purchaseForm.patchValue({
            supplier: purchase.supplier || '',
            invoiceNumber: purchase.invoiceNumber || '',
            notes: purchase.notes || ''
          });
          
          // Clear any default items
          while (this.items.length) {
            this.items.removeAt(0);
          }
          
          // Add items from purchase
          purchase.items.forEach(item => {
            this.items.push(this.fb.group({
              product: [item.product, Validators.required],
              quantity: [item.quantity, [Validators.required, Validators.min(1)]],
              purchasePrice: [item.purchasePrice, [Validators.required, Validators.min(0)]]
            }));
          });
          
          this.updateFilteredProducts();
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al cargar la compra', 'Cerrar', { duration: 3000 });
          this.loading = false;
          this.router.navigate(['/purchases']);
        }
      });
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      product: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      purchasePrice: [0, [Validators.required, Validators.min(0)]]
    });
    
    this.items.push(itemGroup);
    this.updateFilteredProducts();
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.filteredProducts.splice(index, 1);
  }

  updateFilteredProducts(): void {
    // Reset filtered products array
    this.filteredProducts = [];
    
    // Create filtered products observable for each item
    for (let i = 0; i < this.items.length; i++) {
      const itemGroup = this.items.at(i) as FormGroup;
      
      this.filteredProducts[i] = itemGroup.get('product')!.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        switchMap(value => {
          const name = typeof value === 'string' ? value : value.name;
          return this.filterProducts(name);
        })
      );
    }
  }

  filterProducts(value: string): Observable<Product[]> {
    const filterValue = value.toLowerCase();
    
    return of(this.allProducts.filter(product => 
      product.name.toLowerCase().includes(filterValue) || 
      product.barcode.toLowerCase().includes(filterValue)
    ));
  }

  displayProduct(product: Product | string): string {
    if (!product) return '';
    return typeof product === 'string' ? product : product.name;
  }

  onProductSelected(event: any, index: number): void {
    const selectedProduct = event.option.value;
    const itemGroup = this.items.at(index) as FormGroup;
    
    // If the product has a purchase cost, use it as the default purchase price
    if (selectedProduct.purchaseCost) {
      itemGroup.get('purchasePrice')?.setValue(selectedProduct.purchaseCost);
    }
  }

  calculateTotal(): number {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      const itemGroup = this.items.at(i) as FormGroup;
      const quantity = itemGroup.get('quantity')?.value || 0;
      const price = itemGroup.get('purchasePrice')?.value || 0;
      total += quantity * price;
    }
    return total;
  }

  onSubmit(): void {
    if (this.purchaseForm.valid) {
      this.loading = true;
      
      // Format the purchase data
      const purchaseData: Purchase = {
        items: this.formatItems(),
        total: this.calculateTotal(),
        supplier: this.purchaseForm.get('supplier')?.value || undefined,
        invoiceNumber: this.purchaseForm.get('invoiceNumber')?.value || undefined,
        notes: this.purchaseForm.get('notes')?.value || undefined
      };
      
      if (this.isEdit) {
        this.purchaseService.updatePurchase(this.purchaseId, purchaseData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Éxito',
                text: 'Compra actualizada correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
              });
              this.router.navigate(['/purchases']);
            },
            error: (err) => {
              console.error(err);
              Swal.fire({
                title: 'Error',
                text: 'Error al actualizar la compra',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
              this.loading = false;
            }
          });
      } else {
        this.purchaseService.createPurchase(purchaseData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Éxito',
                text: 'Compra creada correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
              });
              this.router.navigate(['/purchases']);
            },
            error: (err) => {
              console.error(err);
              Swal.fire({
                title: 'Error',
                text: 'Error al crear la compra',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
              this.loading = false;
            }
          });
      }
    } else {
      this.markFormGroupTouched(this.purchaseForm);
      this.snackBar.open('Por favor, complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
    }
  }

  formatItems(): PurchaseItem[] {
    const formattedItems: PurchaseItem[] = [];
    
    for (let i = 0; i < this.items.length; i++) {
      const itemGroup = this.items.at(i) as FormGroup;
      const product = itemGroup.get('product')?.value;
      const quantity = itemGroup.get('quantity')?.value;
      const purchasePrice = itemGroup.get('purchasePrice')?.value;
      
      // Format the product data
      const productData = typeof product === 'string' 
        ? { _id: '', name: product, barcode: '' } 
        : { 
            _id: product._id, 
            name: product.name, 
            barcode: product.barcode 
          };
      
      formattedItems.push({
        product: productData,
        quantity: quantity,
        purchasePrice: purchasePrice
      });
    }
    
    return formattedItems;
  }

  // Helper method to mark all controls as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        for (let i = 0; i < control.length; i++) {
          const arrayControl = control.at(i);
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/purchases']);
  }
}
