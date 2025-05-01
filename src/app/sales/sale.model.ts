import { Product } from '../products/product.model';
import { Discount } from '../pos/models/cart-item.model';

export interface SaleItem {
  product: Product;
  quantity: number;
  variant?: {
    color?: string;
    size?: string;
    [key: string]: any;
  };
  salePrice: number;
  discounts?: Discount[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Sale {
  _id?: string;
  user: User | string;
  items: SaleItem[];
  totalAmount: number;
  paymentAmount: number;
  changeAmount: number;
  paymentMethod: any;
  saleDate: string;
  createdAt?: string;
  updatedAt?: string;
}
