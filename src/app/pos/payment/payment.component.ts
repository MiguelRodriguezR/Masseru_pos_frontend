import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { SaleService } from '../../sales/sale.service';
import { CartItem } from '../models/cart-item.model';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaymentMethod } from '../../payment-methods/payment-method.model';
import { PaymentMethodService } from '../../payment-methods/payment-method.service';
import { DiscountUtils } from '../utils/discount-utils';

@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, OnDestroy {
  // Track all subscriptions for cleanup
  private subscriptions: Subscription[] = [];
  
  // Session data
  sessionId: string = '';
  
  // Cart data
  cartItems: CartItem[] = [];
  total: number = 0;
  taxes: number = 0;
  
  // Payment data
  paymentMethods: PaymentMethod[] = [];
  selectedPaymentMethod: string = ''; // Will store the payment method ID
  selectedPaymentMethodObject: PaymentMethod | null = null;
  paymentDetails: Array<{paymentMethod: string, amount: number}> = [];
  totalPaid: number = 0;
  remainingAmount: number = 0;
  changeAmount: number = 0;
  
  // UI state
  isProcessing: boolean = false;
  loadingPaymentMethods: boolean = true;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private saleService: SaleService,
    private paymentMethodService: PaymentMethodService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Get session ID from route params
    const routeSubscription = this.route.params.subscribe(params => {
      this.sessionId = params['sessionId'];
    });
    this.subscriptions.push(routeSubscription);
    
    // Get cart data from router state
    const state = history.state;
    
    console.log('Payment component state:', state);
    
    if (state && state.cartItems && state.cartItems.length > 0) {
      this.cartItems = state.cartItems || [];
      this.total = state.total || 0;
      this.taxes = state.taxes || 0;
      
      // Initialize remaining amount
      this.remainingAmount = this.total;
      
      // Get original prices from state if available
      if (state.originalPrices) {
        this.originalPrices = state.originalPrices;
      } else {
        // Initialize original prices for discount display if not provided
        this.cartItems.forEach(item => {
          // For each item with a discount, we need to store the original price
          if (item.discounts && item.discounts.length > 0) {
            // For percentage discounts, calculate the original price
            const percentageDiscount = item.discounts.find(d => d.type === 'percentage');
            if (percentageDiscount) {
              const discountFactor = 1 - (percentageDiscount.value / 100);
              if (discountFactor > 0) {
                this.originalPrices[item.productId] = item.unitPrice / discountFactor;
              }
            }
            
            // For fixed discounts, add the discount amount to the current price
            const fixedDiscount = item.discounts.find(d => d.type === 'fixed');
            if (fixedDiscount) {
              this.originalPrices[item.productId] = item.unitPrice + fixedDiscount.value;
            }
          }
        });
      }
      
      // Load payment methods
      this.loadPaymentMethods();
    } else {
      console.error('No cart items found in state');
      // If no state, redirect back to POS session
      this.router.navigate(['/pos/session', this.sessionId]);
    }
  }
  
  /**
   * Load active payment methods
   */
  loadPaymentMethods(): void {
    this.loadingPaymentMethods = true;
    
    const subscription = this.paymentMethodService.getActivePaymentMethods()
      .subscribe({
        next: (paymentMethods) => {
          this.paymentMethods = paymentMethods;
          this.loadingPaymentMethods = false;
          
          // Select first payment method by default if available
          if (this.paymentMethods.length > 0) {
            this.selectPaymentMethod(this.paymentMethods[0]._id!);
          }
        },
        error: (error) => {
          console.error('Error loading payment methods:', error);
          this.loadingPaymentMethods = false;
          
          // Show error message
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los métodos de pago'
          });
        }
      });
    
    this.subscriptions.push(subscription);
  }

  /**
   * Select payment method
   */
  selectPaymentMethod(methodId: string): void {
    this.selectedPaymentMethod = methodId;
    this.selectedPaymentMethodObject = this.paymentMethods.find(m => m._id === methodId) || null;
    
    // Initialize amount for this payment method if not already present
    const existingPayment = this.paymentDetails.find(p => p.paymentMethod === methodId);
    if (!existingPayment) {
      this.paymentDetails.push({
        paymentMethod: methodId,
        amount: 0
      });
    }
  }

  /**
   * Get current payment amount for selected method
   */
  getCurrentAmount(): number {
    const payment = this.paymentDetails.find(p => p.paymentMethod === this.selectedPaymentMethod);
    return payment ? payment.amount : 0;
  }

  /**
   * Set current payment amount for selected method
   */
  setCurrentAmount(amount: number): void {
    const payment = this.paymentDetails.find(p => p.paymentMethod === this.selectedPaymentMethod);
    if (payment) {
      payment.amount = amount;
      this.updateAmounts();
    }
  }

  /**
   * Add amount to current payment method
   */
  addAmount(amount: number): void {
    const current = this.getCurrentAmount();
    this.setCurrentAmount(current + amount);
  }

  /**
   * Add specific digit to current payment amount
   */
  addDigit(digit: number): void {
    const current = this.getCurrentAmount();
    this.setCurrentAmount(current * 10 + digit);
  }

  /**
   * Clear current payment amount
   */
  clearAmount(): void {
    this.setCurrentAmount(0);
  }

  /**
   * Delete last digit from current payment amount
   */
  deleteLastDigit(): void {
    const current = this.getCurrentAmount();
    this.setCurrentAmount(Math.floor(current / 10));
  }

  /**
   * Remove payment method
   */
  removePaymentMethod(methodId: string): void {
    this.paymentDetails = this.paymentDetails.filter(p => p.paymentMethod !== methodId);
    this.updateAmounts();
  }

  /**
   * Calculate total paid amount from all payment methods
   */
  calculateTotalPaid(): number {
    return this.paymentDetails.reduce((sum, payment) => sum + payment.amount, 0);
  }

  /**
   * Update remaining and change amounts
   */
  updateAmounts(): void {
    this.totalPaid = this.calculateTotalPaid();
    
    if (this.totalPaid >= this.total) {
      this.remainingAmount = 0;
      this.changeAmount = this.totalPaid - this.total;
    } else {
      this.remainingAmount = this.total - this.totalPaid;
      this.changeAmount = 0;
    }
  }

  /**
   * Process payment and create sale
   */
  validatePayment(): void {
    // Check if payment amount is sufficient
    if (this.totalPaid < this.total) {
      Swal.fire({
        icon: 'warning',
        title: 'Pago insuficiente',
        text: 'El monto pagado debe ser igual o mayor al total de la venta'
      });
      return;
    }
    
    this.isProcessing = true;
    
    // Prepare sale data
    const saleData = {
      items: this.cartItems.map(item => {
        const itemData: any = {
          productId: item.productId,
          quantity: item.quantity
        };
        
        // Include discounts if present
        if (item.discounts && item.discounts.length > 0) {
          itemData.discounts = item.discounts;
        }
        
        return itemData;
      }),
      paymentDetails: this.paymentDetails
        .filter(p => p.amount > 0) // Only include payment methods with amount > 0
        .map(p => ({
          paymentMethod: p.paymentMethod,
          amount: p.amount
        }))
    };
    
    // Create sale
    const subscription = this.saleService.createSale(saleData).subscribe({
      next: (response) => {
        this.isProcessing = false;
        
        Swal.fire({
          icon: 'success',
          title: 'Venta realizada',
          text: 'La venta ha sido registrada exitosamente',
          timer: 1000,
          showConfirmButton: false
        }).then(() => {
          // Navigate back to POS session
          this.router.navigate(['/pos/session', this.sessionId]);
        });
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('Error al procesar la venta:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al procesar la venta: ' + error.error.msg
        });
      }
    });
    
    this.subscriptions.push(subscription);
  }

  /**
   * Handle keyboard events for numeric input
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Handle numeric keys (0-9)
    if (/^[0-9]$/.test(event.key)) {
      this.addDigit(parseInt(event.key, 10));
      event.preventDefault();
    } 
    // Handle backspace key to delete last digit
    else if (event.key === 'Backspace') {
      this.deleteLastDigit();
      event.preventDefault();
    } 
    // Handle escape key to go back
    else if (event.key === 'Escape') {
      this.goBack();
      event.preventDefault();
    }
    // Handle enter key to validate payment
    else if (event.key === 'Enter' && this.totalPaid >= this.total && !this.isProcessing) {
      this.validatePayment();
      event.preventDefault();
    }
  }

  // Original prices for displaying discount information
  originalPrices: {[productId: string]: number} = {};

  /**
   * Get discount percentage for a product
   */
  getDiscountPercent(item: CartItem): number {
    return DiscountUtils.getDiscountPercent(item);
  }

  /**
   * Get fixed discount amount for a product
   */
  getFixedDiscountAmount(item: CartItem): number {
    return DiscountUtils.getFixedDiscountAmount(item);
  }

  /**
   * Check if an item has any discount
   */
  hasDiscount(item: CartItem): boolean {
    return DiscountUtils.hasDiscount(item);
  }

  /**
   * Format discount text for display
   */
  getDiscountText(item: CartItem): string {
    return DiscountUtils.formatDiscountText(item, this.originalPrices);
  }

  /**
   * Get payment method details by ID
   */
  getPaymentMethod(methodId: string): PaymentMethod | undefined {
    return this.paymentMethods.find(m => m._id === methodId);
  }

  /**
   * Get payment method name
   */
  getPaymentMethodName(methodId: string): string {
    const method = this.getPaymentMethod(methodId);
    return method?.name || 'Desconocido';
  }

  /**
   * Get payment method icon
   */
  getPaymentMethodIcon(methodId: string): string {
    const method = this.getPaymentMethod(methodId);
    return method?.icon || 'credit_card';
  }

  /**
   * Get payment method color
   */
  getPaymentMethodColor(methodId: string): string {
    const method = this.getPaymentMethod(methodId);
    return method?.color || '#666';
  }

  /**
   * Go back to POS session
   */
  goBack(): void {
    // Navigate back to POS session with the cart items and original prices
    this.router.navigate(['/pos/session', this.sessionId], {
      state: {
        preserveCart: true,
        cartItems: this.cartItems,
        originalPrices: this.originalPrices
      }
    });
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
