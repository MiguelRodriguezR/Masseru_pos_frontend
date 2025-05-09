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
  paymentAmount: number = 0;
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
  }

  /**
   * Add amount to payment
   */
  addAmount(amount: number): void {
    this.paymentAmount += amount;
    this.updateAmounts();
  }

  /**
   * Add specific digit to payment amount
   */
  addDigit(digit: number): void {
    this.paymentAmount = this.paymentAmount * 10 + digit;
    this.updateAmounts();
  }

  /**
   * Clear payment amount
   */
  clearAmount(): void {
    this.paymentAmount = 0;
    this.updateAmounts();
  }

  /**
   * Delete last digit from payment amount
   */
  deleteLastDigit(): void {
    this.paymentAmount = Math.floor(this.paymentAmount / 10);
    this.updateAmounts();
  }

  /**
   * Update remaining and change amounts
   */
  updateAmounts(): void {
    if (this.paymentAmount >= this.total) {
      this.remainingAmount = 0;
      this.changeAmount = this.paymentAmount - this.total;
    } else {
      this.remainingAmount = this.total - this.paymentAmount;
      this.changeAmount = 0;
    }
  }

  /**
   * Process payment and create sale
   */
  validatePayment(): void {
    // Check if payment amount is sufficient
    if (this.paymentAmount < this.total) {
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
      paymentMethod: this.selectedPaymentMethod,
      paymentAmount: this.paymentAmount
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
    else if (event.key === 'Enter' && this.paymentAmount >= this.total && !this.isProcessing) {
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
