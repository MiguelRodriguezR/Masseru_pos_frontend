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
  selectedPaymentMethod: string = 'cash'; // Default to cash
  paymentAmount: number = 0;
  remainingAmount: number = 0;
  changeAmount: number = 0;
  
  // UI state
  isProcessing: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private saleService: SaleService,
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
    } else {
      console.error('No cart items found in state');
      // If no state, redirect back to POS session
      this.router.navigate(['/pos/session', this.sessionId]);
    }
  }

  /**
   * Select payment method
   */
  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
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
      items: this.cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
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
          text: 'Error al procesar la venta. Por favor, intente nuevamente.'
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

  /**
   * Go back to POS session
   */
  goBack(): void {
    // Navigate back to POS session with the cart items
    this.router.navigate(['/pos/session', this.sessionId], {
      state: {
        preserveCart: true,
        cartItems: this.cartItems
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
