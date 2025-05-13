//TODO: NEEDS REFACTOR

import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { PosSessionService } from '../pos-session.service';
import { ProductService } from '../../products/product.service';
import { CartItem } from '../models/cart-item.model';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Product } from '../../products/product.model';
import { DiscountUtils } from '../utils/discount-utils';

@Component({
  selector: 'app-pos-session',
  templateUrl: './pos-session.component.html',
  styleUrls: ['./pos-session.component.scss']
})
export class PosSessionComponent implements OnInit, OnDestroy {
  // Track all subscriptions for cleanup
  private subscriptions: Subscription[] = [];
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  // Session data
  sessionId: string = '';
  sessionData: any = null;
  
  // Products and cart
  products: any[] = [];
  cartItems: CartItem[] = [];
  searchTerm: string = '';
  
  // UI state
  isLoading: boolean = true;
  errorMessage: string = '';
  selectedCartItem: CartItem | null = null;
  quantityInput = new FormControl(1);
  isQuantityButtonSelected: boolean = false;
  
  // Totals
  total: number = 0;
  taxes: number = 0;

  // Discounts and original prices
  discounts: {[productId: string]: number} = {};
  priceDiscounts: {[productId: string]: number} = {};
  originalPrices: {[productId: string]: number} = {};
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private posSessionService: PosSessionService,
    private productService: ProductService
  ) {}

  /**
   * Apply percentage discount to selected cart item
   */
  applyDiscount(): void {
    if (!this.selectedCartItem) {
      Swal.fire({
        icon: 'warning',
        title: 'Ningún ítem seleccionado',
        text: 'Por favor seleccione un ítem del carrito para aplicar descuento'
      });
      return;
    }

    Swal.fire({
      title: 'Aplicar Descuento',
      html: `
        <div class="swal-discount">
          <div class="swal-input-group">
            <label for="swal-discount-percent">Porcentaje de descuento (0-100)</label>
            <input id="swal-discount-percent" type="number" class="swal2-input" 
                   min="0" max="100" value="0">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aplicar',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        const discountInput = document.getElementById('swal-discount-percent') as HTMLInputElement;
        const discountPercent = Number(discountInput.value);

        if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
          Swal.showValidationMessage('Por favor ingrese un porcentaje válido entre 0 y 100');
          return false;
        }

        return discountPercent;
      }
    }).then((result) => {
      if (result.isConfirmed && this.selectedCartItem) {
        const discountPercent = result.value;
        const productId = this.selectedCartItem.productId;
        
        // Store discount percentage for display purposes
        this.discounts[productId] = discountPercent;
        
        // Apply percentage discount using utility method
        DiscountUtils.applyPercentageDiscount(
          this.selectedCartItem,
          discountPercent,
          this.originalPrices
        );

        // console.log({cartItem : this.selectedCartItem})
        
        this.updateTotals();
        
        Swal.fire({
          icon: 'success',
          title: 'Descuento aplicado',
          text: `Se aplicó un ${discountPercent}% de descuento al producto`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  /**
   * Apply fixed price discount to selected cart item
   */
  applyPriceDiscount(): void {
    if (!this.selectedCartItem) {
      Swal.fire({
        icon: 'warning',
        title: 'Ningún ítem seleccionado',
        text: 'Por favor seleccione un ítem del carrito para modificar el precio'
      });
      return;
    }

    // Store original price if not already stored
    const productId = this.selectedCartItem.productId;
    if (!this.originalPrices[productId]) {
      this.originalPrices[productId] = this.selectedCartItem.unitPrice;
    }
    
    const originalPrice = this.originalPrices[productId];

    Swal.fire({
      title: 'Modificar Precio',
      html: `
        <div class="swal-price">
          <div class="swal-input-group">
            <label for="swal-new-price">Nuevo precio unitario</label>
            <input id="swal-new-price" type="number" class="swal2-input" 
                   min="0" value="${this.selectedCartItem.unitPrice}">
          </div>
          <p class="swal-price-info">Precio original: ${originalPrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aplicar',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        const priceInput = document.getElementById('swal-new-price') as HTMLInputElement;
        const newPrice = Number(priceInput.value);

        if (isNaN(newPrice) || newPrice < 0) {
          Swal.showValidationMessage('Por favor ingrese un precio válido mayor o igual a 0');
          return false;
        }

        return newPrice;
      }
    }).then((result) => {
      if (result.isConfirmed && this.selectedCartItem) {
        const newPrice = result.value;
        
        this.priceDiscounts[productId] = newPrice;

        // Apply fixed price discount using utility method
        DiscountUtils.applyFixedPriceDiscount(
          this.selectedCartItem,
          newPrice,
          this.originalPrices
        );
        
        this.updateTotals();
        
        // Calculate the discount amount
        const discountAmount = originalPrice - newPrice;
        const discountType = discountAmount > 0 ? 'descuento' : 'aumento';
        const absDiscountAmount = Math.abs(discountAmount);
        
        
        Swal.fire({
          icon: 'success',
          title: 'Precio modificado',
          text: `Se aplicó un ${absDiscountAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} de ${discountType} al producto`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  ngOnInit(): void {
    // Get session ID from route params
    const subscription = this.route.params.subscribe(params => {
      this.sessionId = params['id'];
      this.loadSessionData();
      this.loadProducts();
      
      // Check if we have cart items in the state (coming back from payment)
      const state = history.state;
      if (state && state.preserveCart && state.cartItems && state.cartItems.length > 0) {
        console.log('Restoring cart items from state:', state.cartItems);
        this.cartItems = state.cartItems;
        
        // Restore original prices if available
        if (state.originalPrices) {
          this.originalPrices = state.originalPrices;
        }
        
        this.updateTotals();
      }
    });
    this.subscriptions.push(subscription);
    
    // Setup search debouncer
    this.searchSubject.pipe(
      debounceTime(400), // Wait for 400ms after the last event before emitting
      distinctUntilChanged(), // Only emit if value is different from previous
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.loadProducts(searchTerm);
    });
  }

  /**
   * Handle keyboard events for quantity input and item removal
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Only process keyboard events when a cart item is selected and quantity button is selected
    if (this.selectedCartItem && this.isQuantityButtonSelected) {
      if (/^[0-9]$/.test(event.key)) {
        // Handle numeric keys
        this.addDigit(parseInt(event.key, 10));
        event.preventDefault();
      } else if (event.key === 'Backspace') {
        // Handle backspace key to delete last digit
        this.deleteDigit();
        event.preventDefault();
      } else if (event.key === 'Delete') {
        // Handle delete key to remove item
        this.removeFromCart(this.selectedCartItem);
        this.selectedCartItem = null;
        this.isQuantityButtonSelected = false;
        event.preventDefault();
      }
    }
  }

  /**
   * Load session data from API
   */
  loadSessionData(): void {
    if (!this.sessionId) {
      this.errorMessage = 'ID de sesión no válido';
      this.isLoading = false;
      return;
    }

    const subscription = this.posSessionService.getSessionById(this.sessionId).subscribe({
      next: (data) => {
        this.sessionData = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar la sesión:', error);
        this.errorMessage = 'Error al cargar la información de la sesión';
        this.isLoading = false;
      }
    });
    
    this.subscriptions.push(subscription);
  }

  /**
   * Load products from API
   */
  loadProducts(search: string = ''): void {
    const subscription = this.productService.getProducts(1, 10000, search).subscribe({
      next: (data) => {
        this.products = data.products;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
    
    this.subscriptions.push(subscription);
  }

  /**
   * Search products
   */
  searchProducts(): void {
    this.searchSubject.next(this.searchTerm);
  }
  
  /**
   * Handle search input changes
   */
  onSearchInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  /**
   * Add product to cart
   */
  addToCart(product: any): void {
    // Check if product is already in cart
    const existingItem = this.cartItems.find(item => item.productId === product._id);
    
    if (existingItem) {
      // Increment quantity if already in cart
      existingItem.quantity += 1;
      
      // Store original price if not already stored
      if (!this.originalPrices[product._id]) {
        this.originalPrices[product._id] = product.salePrice;
      }
      
      // Reset to original price
      existingItem.unitPrice = this.originalPrices[product._id];
      
      // Reapply any percentage discount if it exists
      if (this.discounts[product._id]) {
        const discountPercent = this.discounts[product._id];
        DiscountUtils.applyPercentageDiscount(
          existingItem,
          discountPercent,
          this.originalPrices
        );
      } else if (this.priceDiscounts[product._id]){
        const discountPrice = this.priceDiscounts[product._id]
        DiscountUtils.applyFixedPriceDiscount(
          existingItem,
          discountPrice,
          this.originalPrices
        );
      }else {
        // Recalculate total price if no discount
        existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
      }
    } else {
      // Store original price
      this.originalPrices[product._id] = product.salePrice;
      
      // Add new item to cart with original price
      const newItem: CartItem = {
        productId: product._id,
        name: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        totalPrice: product.salePrice,
        unitOfMeasure: 'unidad' // Default unit of measure
      };
      
      this.cartItems.push(newItem);
    }

    // console.log({product, originalPrices : this.originalPrices, discounts: this.discounts, existingItem})
    
    this.updateTotals();
  }

  /**
   * Remove item from cart
   */
  removeFromCart(item: CartItem): void {
    this.selectedCartItem = null;
    this.cartItems = this.cartItems.filter(cartItem => cartItem.productId !== item.productId);
    delete this.discounts[item.productId];
    delete this.priceDiscounts[item.productId];
    this.updateTotals();
  }

  /**
   * Select cart item for editing
   */
  selectCartItem(item: CartItem): void {
    this.selectedCartItem = item;
    this.quantityInput.setValue(item.quantity);
  }

  /**
   * Toggle quantity button selection
   */
  toggleQuantityButton(): void {
    this.isQuantityButtonSelected = !this.isQuantityButtonSelected;
    
    // If turning off quantity mode, update the quantity
    if (!this.isQuantityButtonSelected && this.selectedCartItem) {
      this.applyQuantityChange();
    }
  }

  /**
   * Apply quantity change to selected cart item
   */
  applyQuantityChange(): void {
    if (this.selectedCartItem) {
      const newQuantity = this.quantityInput.value || 1;
      this.selectedCartItem.quantity = newQuantity;
      this.selectedCartItem.totalPrice = this.selectedCartItem.quantity * this.selectedCartItem.unitPrice;
      this.updateTotals();
    }
  }

  /**
   * Add digit to quantity input
   */
  addDigit(digit: number): void {
    if (!this.selectedCartItem || !this.isQuantityButtonSelected) {
      return;
    }
    
    const currentValue = this.quantityInput.value || 0;
    const newValue = Number(`${currentValue}${digit}`);
    this.quantityInput.setValue(newValue);
    
    // Apply the change immediately for real-time update
    this.applyQuantityChange();
  }

  /**
   * Delete last digit from quantity input
   */
  deleteDigit(): void {
    if (!this.selectedCartItem || !this.isQuantityButtonSelected) {
      return;
    }
    
    const currentValue = this.quantityInput.value?.toString() || '0';
    
    if (currentValue.length <= 1) {
      // If only one digit, set to 0 (minimum quantity)
      this.quantityInput.setValue(0);
    } else {
      // Remove last digit
      const newValue = Number(currentValue.slice(0, -1));
      this.quantityInput.setValue(newValue);
    }
    
    // Apply the change immediately for real-time update
    this.applyQuantityChange();
  }

  /**
   * Clear quantity input
   */
  clearQuantity(): void {
    this.quantityInput.setValue(0);
  }

  /**
   * Update cart totals
   */
  updateTotals(): void {
    this.total = this.cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    // Calculate taxes (assuming 19% VAT)
    this.taxes = this.total * 0.19;
  }

  /**
   * Get discount percentage for a product
   */
  getDiscountPercent(productId: string): number {
    return this.discounts[productId] || 0;
  }

  /**
   * Format discount text for display
   */
  getDiscountText(item: CartItem): string {
    if (!item.discounts || item.discounts.length === 0) {
      return '';
    }

    return DiscountUtils.formatDiscountText(item, this.originalPrices);
  }

  /**
   * Check if an item has any discount
   */
  hasDiscount(item: CartItem): boolean {
    return DiscountUtils.hasDiscount(item);
  }

  /**
   * Proceed to payment
   */
  proceedToPayment(): void {
    if (this.cartItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'Debe agregar productos al carrito antes de proceder al pago'
      });
      return;
    }
    
    // Ensure all cart items have discount information if applicable
    this.cartItems.forEach(item => {
      const productId = item.productId;
      
      // If there's a discount for this product but no discount info in the cart item
      if (this.discounts[productId] && (!item.discounts || item.discounts.length === 0)) {
        item.discounts = [{
          type: 'percentage',
          value: this.discounts[productId]
        }];
      }
    });
    
    console.log('Proceeding to payment with items:', this.cartItems);
    
    // Create a deep copy of the cart items to avoid reference issues
    const cartItemsCopy = JSON.parse(JSON.stringify(this.cartItems));
    
    // Create a deep copy of the original prices to avoid reference issues
    const originalPricesCopy = JSON.parse(JSON.stringify(this.originalPrices));
    
    // Navigate to payment component with session ID
    this.router.navigate(['/pos/payment', this.sessionId], {
      state: {
        cartItems: cartItemsCopy,
        total: this.total,
        taxes: this.taxes,
        originalPrices: originalPricesCopy
      }
    });
  }

  /**
   * Close POS session
   */
  closeSession(): void {
    // Get initial cash amount from session data
    const initialCash = this.sessionData?.initialCash || 0;
    const expectedCash = this.sessionData?.expectedCash || 0;
    const expectedNonCash = this.sessionData?.expectedNonCash || 0;
    
    Swal.fire({
      title: 'Cerrar Caja',
      html: `
        <div class="swal-cash-close">
          <p>Cantidad inicial: ${initialCash.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
          <p>Cantidad esperada en efectivo: ${expectedCash.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
          <p>Cantidad esperada en otros medios: ${expectedNonCash.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
          <div class="swal-input-group">
            <label for="swal-actual-cash">Cantidad final de dinero en caja</label>
            <input id="swal-actual-cash" type="number" class="swal2-input" value="${initialCash}" min="0" step="1000">
          </div>
          <div class="swal-input-group">
            <label for="swal-notes">Notas adicionales</label>
            <textarea id="swal-notes" class="swal2-textarea" placeholder="Ingrese notas adicionales sobre el cierre de caja"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Cerrar Caja',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        const actualCashInput = document.getElementById('swal-actual-cash') as HTMLInputElement;
        const notesInput = document.getElementById('swal-notes') as HTMLTextAreaElement;
        
        const actualCash = Number(actualCashInput.value);
        const notes = notesInput.value;
        
        if (isNaN(actualCash) || actualCash < 0) {
          Swal.showValidationMessage('Por favor ingrese una cantidad válida de dinero');
          return false;
        }
        
        return { actualCash, notes };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { actualCash, notes } = result.value;
        
        const subscription = this.posSessionService.closeSession(
          this.sessionId,
          actualCash,
          notes || 'Sesión cerrada desde la interfaz POS'
        ).subscribe({
          next: (response) => {
            console.log('Sesión POS cerrada correctamente:', response);
            Swal.fire({
              icon: 'success',
              title: 'Caja Cerrada',
              text: 'La sesión de POS ha sido cerrada correctamente',
              timer: 2000,
              showConfirmButton: false
            }).then(() => {
              this.router.navigate(['/pos']);
            });
          },
          error: (error) => {
            console.error('Error al cerrar la sesión POS:', error);
            this.errorMessage = 'Error al cerrar la sesión POS. Por favor, intente nuevamente.';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error al cerrar la sesión POS. Por favor, intente nuevamente.'
            });
          }
        });
        
        this.subscriptions.push(subscription);
      }
    });
  }

  /**
   * Get the image URL for a product
   */
  getProductImage(product: Product): string {
    if (product.images && product.images.length > 0) {
      return this.productService.getImageUrl(product.images[0]);
    }
    return '';
  }

  /**
   * Cleanup subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.subscriptions.forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
    
    // Complete the destroy subject
    this.destroy$.next();
    this.destroy$.complete();
  }
}
