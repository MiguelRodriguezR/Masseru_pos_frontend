export interface SaleItem {
  productId: string;
  quantity: number;
  variant?: {
    color: string;
    size: string;
  };
}

export interface Sale {
  _id?: string;
  user: string;
  items: SaleItem[];
  totalAmount: number;
  paymentAmount: number;
  changeAmount: number;
  paymentMethod: string;
  saleDate: string;
  createdAt?: string;
  updatedAt?: string;
}
