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
    saleDate: string;
  }
  