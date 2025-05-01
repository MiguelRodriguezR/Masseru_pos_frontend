export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
}

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitOfMeasure?: string;
  discounts?: Discount[];
}
