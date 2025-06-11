import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { Sale, SaleItem, PaymentDetail } from '../sale.model';
import { SaleService } from '../sale.service';
import { Product } from '../../products/product.model';
import { ProductService } from '../../products/product.service';
import { PaymentMethod } from '../../payment-methods/payment-method.model';
import { PaymentMethodService } from '../../payment-methods/payment-method.service';

@Component({
  selector: 'app-sale-edit',
  templateUrl: './sale-edit.component.html',
  styleUrls: ['./sale-edit.component.scss']
})
export class SaleEditComponent implements OnInit, OnDestroy {
  saleForm: FormGroup;
  sale?: Sale;
  products: Product[] = [];
  paymentMethods: PaymentMethod[] = [];
  loading: boolean = false;
  saving: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private saleService: SaleService,
    private productService: ProductService,
    private paymentMethodService: PaymentMethodService,
    private snackBar: MatSnackBar
  ) {
    this.saleForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      items: this.fb.array([]),
      paymentDetails: this.fb.array([])
    });
  }

  private loadInitialData(): void {
    const saleId = this.route.snapshot.paramMap.get('id');
    if (!saleId) {
      this.router.navigate(['/sales']);
      return;
    }

    this.loading = true;

    forkJoin({
      sale: this.saleService.getSale(saleId),
      products: this.productService.getProducts(1, 1000), // Get all products
      paymentMethods: this.paymentMethodService.getActivePaymentMethods()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.sale = data.sale;
        this.products = data.products.products;
        this.paymentMethods = data.paymentMethods;
        this.populateForm();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.snackBar.open('Error al cargar los datos', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/sales']);
        this.loading = false;
      }
    });
  }

  private populateForm(): void {
    if (!this.sale) return;

    // Populate items
    const itemsArray = this.saleForm.get('items') as FormArray;
    this.sale.items.forEach(item => {
      itemsArray.push(this.createItemFormGroup(item));
    });

    // Populate payment details
    const paymentsArray = this.saleForm.get('paymentDetails') as FormArray;
    this.sale.paymentDetails.forEach(payment => {
      paymentsArray.push(this.createPaymentFormGroup(payment));
    });
  }

  private createItemFormGroup(item?: SaleItem): FormGroup {
    return this.fb.group({
      productId: [item?.product._id || '', Validators.required],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      variant: [item?.variant || null],
      discounts: [item?.discounts || []]
    });
  }

  private createPaymentFormGroup(payment?: PaymentDetail): FormGroup {
    return this.fb.group({
      paymentMethod: [payment?.paymentMethod._id || payment?.paymentMethod || '', Validators.required],
      amount: [payment?.amount || 0, [Validators.required, Validators.min(0.01)]]
    });
  }

  get itemsArray(): FormArray {
    return this.saleForm.get('items') as FormArray;
  }

  get paymentsArray(): FormArray {
    return this.saleForm.get('paymentDetails') as FormArray;
  }

  addItem(): void {
    this.itemsArray.push(this.createItemFormGroup());
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
    } else {
      this.snackBar.open('Debe mantener al menos un producto', 'Cerrar', { duration: 3000 });
    }
  }

  addPayment(): void {
    this.paymentsArray.push(this.createPaymentFormGroup());
  }

  removePayment(index: number): void {
    if (this.paymentsArray.length > 1) {
      this.paymentsArray.removeAt(index);
    } else {
      this.snackBar.open('Debe mantener al menos un método de pago', 'Cerrar', { duration: 3000 });
    }
  }

  getProductName(productId: string): string {
    const product = this.products.find(p => p._id === productId);
    return product ? product.name : 'Producto no encontrado';
  }

  getProductPrice(productId: string): number {
    const product = this.products.find(p => p._id === productId);
    return product ? product.salePrice : 0;
  }

  getPaymentMethodName(paymentMethodId: string): string {
    const paymentMethod = this.paymentMethods.find(pm => pm._id === paymentMethodId);
    return paymentMethod ? paymentMethod.name : 'Método no encontrado';
  }

  calculateItemSubtotal(item: any): number {
    const product = this.products.find(p => p._id === item.productId);
    if (!product) return 0;
    
    let price = product.salePrice;
    
    // Apply discounts if any
    if (item.discounts && item.discounts.length > 0) {
      const totalDiscount = item.discounts.reduce((total: number, discount: any) => {
        if (discount.type === 'percentage') {
          return total + (price * discount.value / 100);
        } else if (discount.type === 'fixed') {
          return total + discount.value;
        }
        return total;
      }, 0);
      price -= totalDiscount;
    }
    
    return price * item.quantity;
  }

  calculateTotal(): number {
    return this.itemsArray.controls.reduce((total, control) => {
      return total + this.calculateItemSubtotal(control.value);
    }, 0);
  }

  calculateTotalPayment(): number {
    return this.paymentsArray.controls.reduce((total, control) => {
      return total + (control.value.amount || 0);
    }, 0);
  }

  calculateChange(): number {
    return this.calculateTotalPayment() - this.calculateTotal();
  }

  onSubmit(): void {
    if (this.saleForm.invalid) {
      this.markFormGroupTouched(this.saleForm);
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    const totalPayment = this.calculateTotalPayment();
    const totalAmount = this.calculateTotal();

    if (totalPayment < totalAmount) {
      this.snackBar.open('El monto total de pago debe cubrir el total de la venta', 'Cerrar', { duration: 3000 });
      return;
    }

    Swal.fire({
      title: '¿Confirmar actualización?',
      text: 'Esta acción actualizará la venta y afectará el inventario',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateSale();
      }
    });
  }

  private updateSale(): void {
    if (!this.sale?._id) return;

    this.saving = true;
    const formValue = this.saleForm.value;

    const updateData = {
      items: formValue.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        variant: item.variant,
        discounts: item.discounts
      })),
      paymentDetails: formValue.paymentDetails.map((payment: any) => ({
        paymentMethod: payment.paymentMethod,
        amount: payment.amount
      }))
    };

    this.saleService.updateSale(this.sale._id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.saving = false;
          Swal.fire({
            title: '¡Éxito!',
            text: 'La venta ha sido actualizada correctamente',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.router.navigate(['/sales', this.sale?._id]);
          });
        },
        error: (error) => {
          this.saving = false;
          console.error('Error updating sale:', error);
          Swal.fire({
            title: 'Error',
            text: error.error?.msg || 'Error al actualizar la venta',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/sales', this.sale?._id]);
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });
  }
}
