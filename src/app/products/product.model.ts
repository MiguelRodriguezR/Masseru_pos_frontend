export interface Variant {
    color: string;
    size: string;
    quantity: number;
  }
  
  export interface Product {
    _id?: string;
    salePrice: number;
    purchaseCost: number;
    barcode: string;
    name: string;
    description?: string;
    images: string[];
    quantity: number;
    variants: Variant[];
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
  }
  