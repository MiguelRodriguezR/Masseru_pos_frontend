export interface PurchaseItem {
  product: {
    _id: string;
    name: string;
    barcode: string;
    salePrice?: number;
    purchaseCost?: number;
  };
  quantity: number;
  purchasePrice: number;
}

export interface Purchase {
  _id?: string;
  items: PurchaseItem[];
  total: number;
  supplier?: string;
  invoiceNumber?: string;
  notes?: string;
  createdBy?: {
    _id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}
