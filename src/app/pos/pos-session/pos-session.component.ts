import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { PosSessionService } from '../pos-session.service';
import { ProductService } from '../../products/product.service';
import { CartItem } from '../models/cart-item.model';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { Product } from '../../products/product.model';

@Component({
  selector: 'app-pos-session',
  templateUrl: './pos-session.component.html',
  styleUrls: ['./pos-session.component.scss']
})
export class PosSessionComponent implements OnInit, OnDestroy {
  // Track all subscriptions for cleanup
  private subscriptions: Subscription[] = [];
  
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
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private posSessionService: PosSessionService,
    private productService: ProductService
  ) {}

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
        this.updateTotals();
      }
    });
    this.subscriptions.push(subscription);
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
  loadProducts(): void {
    const subscription = this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
    
    this.subscriptions.push(subscription);
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
      existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
    } else {
      // Add new item to cart
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
    
    this.updateTotals();
  }

  /**
   * Remove item from cart
   */
  removeFromCart(item: CartItem): void {
    this.cartItems = this.cartItems.filter(cartItem => cartItem.productId !== item.productId);
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
    
    console.log('Proceeding to payment with items:', this.cartItems);
    
    // Create a deep copy of the cart items to avoid reference issues
    const cartItemsCopy = JSON.parse(JSON.stringify(this.cartItems));
    
    // Navigate to payment component with session ID
    this.router.navigate(['/pos/payment', this.sessionId], {
      state: {
        cartItems: cartItemsCopy,
        total: this.total,
        taxes: this.taxes
      }
    });
  }

  /**
   * Close POS session
   */
  closeSession(): void {
    // Get initial cash amount from session data
    const initialCash = this.sessionData?.initialCash || 0;
    
    Swal.fire({
      title: 'Cerrar Caja',
      html: `
        <div class="swal-cash-close">
          <p>Cantidad inicial: ${initialCash.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
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
  }
}
