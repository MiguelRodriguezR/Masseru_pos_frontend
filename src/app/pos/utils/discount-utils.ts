import { CartItem, Discount } from '../models/cart-item.model';

/**
 * Utility functions for handling discounts in the POS system
 */
export class DiscountUtils {
  
  /**
   * Apply a percentage discount to a cart item
   * @param item The cart item to apply the discount to
   * @param discountPercent The percentage discount to apply (0-100)
   * @param originalPrices Map of original prices by product ID
   */
  static applyPercentageDiscount(
    item: CartItem, 
    discountPercent: number, 
    originalPrices: {[productId: string]: number}
  ): void {
    // Store original price if not already stored
    if (!originalPrices[item.productId]) {
      originalPrices[item.productId] = item.unitPrice;
    }
    
    // Calculate new unit price with discount
    const originalPrice = originalPrices[item.productId];
    const discountAmount = originalPrice * (discountPercent / 100);
    const discountedPrice = originalPrice - discountAmount;
    
    // Update cart item prices
    item.unitPrice = discountedPrice;
    item.totalPrice = discountedPrice * item.quantity;
    
    // Initialize discounts array if it doesn't exist
    if (!item.discounts) {
      item.discounts = [];
    }
    
    // Clear existing discounts and add the new one
    item.discounts = [{
      type: 'percentage',
      value: discountPercent
    }];

    console.log({originalPrice, discountAmount, discountedPrice, item})
  }

  /**
   * Apply a fixed price discount to a cart item
   * @param item The cart item to apply the discount to
   * @param newPrice The new fixed price to set
   * @param originalPrices Map of original prices by product ID
   */
  static applyFixedPriceDiscount(
    item: CartItem, 
    newPrice: number, 
    originalPrices: {[productId: string]: number}
  ): void {
    // Store original price if not already stored
    if (!originalPrices[item.productId]) {
      originalPrices[item.productId] = item.unitPrice;
    }
    
    const originalPrice = originalPrices[item.productId];
    
    // Calculate the discount amount (can be negative if price increased)
    const discountAmount = originalPrice - newPrice;
    
    // Update cart item prices
    item.unitPrice = newPrice;
    item.totalPrice = newPrice * item.quantity;
    
    // Initialize discounts array if it doesn't exist
    if (!item.discounts) {
      item.discounts = [];
    }
    
    // Clear existing discounts and add the new one
    item.discounts = [{
      type: 'fixed',
      value: discountAmount
    }];
  }

  /**
   * Get the discount percentage for a product
   * @param item The cart item to check
   * @returns The discount percentage or 0 if no percentage discount
   */
  static getDiscountPercent(item: CartItem): number {
    if (item.discounts && item.discounts.length > 0) {
      const discount = item.discounts.find(d => d.type === 'percentage');
      if (discount) {
        return discount.value;
      }
    }
    return 0;
  }

  /**
   * Get the fixed discount amount for a product
   * @param item The cart item to check
   * @returns The fixed discount amount or 0 if no fixed discount
   */
  static getFixedDiscountAmount(item: CartItem): number {
    if (item.discounts && item.discounts.length > 0) {
      const discount = item.discounts.find(d => d.type === 'fixed');
      if (discount) {
        return discount.value;
      }
    }
    return 0;
  }

  /**
   * Check if an item has any discount
   * @param item The cart item to check
   * @returns True if the item has any discount
   */
  static hasDiscount(item: CartItem): boolean {
    return !!(item.discounts && item.discounts.length > 0);
  }

  /**
   * Check if an item has a percentage discount
   * @param item The cart item to check
   * @returns True if the item has a percentage discount
   */
  static hasPercentageDiscount(item: CartItem): boolean {
    return this.getDiscountPercent(item) > 0;
  }

  /**
   * Check if an item has a fixed price discount
   * @param item The cart item to check
   * @returns True if the item has a fixed price discount
   */
  static hasFixedDiscount(item: CartItem): boolean {
    return this.getFixedDiscountAmount(item) !== 0;
  }

  /**
   * Format the discount display text
   * @param item The cart item to format the discount for
   * @param originalPrices Map of original prices by product ID
   * @returns Formatted discount text
   */
  static formatDiscountText(item: CartItem, originalPrices: {[productId: string]: number}): string {
    if (!item.discounts || item.discounts.length === 0) {
      return '';
    }

    const discount = item.discounts[0];
    
    if (discount.type === 'percentage') {
      return `(${discount.value}% descuento)`;
    } else if (discount.type === 'fixed') {
      const originalPrice = originalPrices[item.productId];
      // If discount is positive, it's a price reduction
      if (discount.value > 0) {
        return `($ ${Math.floor(discount.value).toLocaleString('es-CO')} descuento)`;
      } 
      // If discount is negative, it's a price increase
      else if (discount.value < 0) {
        return `($ ${Math.abs(Math.floor(discount.value)).toLocaleString('es-CO')} aumento)`;
      }
    }
    
    return '';
  }
}
