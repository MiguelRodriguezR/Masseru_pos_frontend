export interface PaymentMethod {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
