export interface OperationalExpense {
  _id?: string;
  reason: string;
  totalAmount: number;
  notes?: string;
  date: string;
  createdBy?: {
    _id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}
