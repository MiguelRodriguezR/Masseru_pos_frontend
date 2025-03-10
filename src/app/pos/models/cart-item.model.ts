export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitOfMeasure?: string;
}
