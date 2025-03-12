import { Product } from '../products/product.model';

export interface SaleItem {
  product: Product;
  quantity: number;
  variant?: {
    color?: string;
    size?: string;
    [key: string]: any;
  };
  salePrice: number;
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
