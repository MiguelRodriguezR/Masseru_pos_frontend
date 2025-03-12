import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaymentMethod } from './payment-method.model';
import { BaseService } from '../shared/base.service';
import { EnvironmentService } from '../shared/environment.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService extends BaseService {
  
  constructor(
    private http: HttpClient,
    environmentService: EnvironmentService
  ) {
    super(environmentService);
  }

  /**
   * Get all payment methods
   */
  getPaymentMethods(page: number = 1, limit: number = 10): Observable<{ paymentMethods: PaymentMethod[], total: number }> {
    return this.http.get<{ paymentMethods: PaymentMethod[] }>(
      `${this.baseUrl}/api/payment-methods?page=${page}&limit=${limit}`
    ).pipe(
      map(response => ({
        paymentMethods: response.paymentMethods,
        total: response.paymentMethods.length
      }))
    );
  }

  /**
   * Get active payment methods
   */
  getActivePaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<{ paymentMethods: PaymentMethod[] }>(
      `${this.baseUrl}/api/payment-methods/active`
    ).pipe(
      map(response => response.paymentMethods)
    );
  }

  /**
   * Get payment method by ID
   */
  getPaymentMethodById(id: string): Observable<PaymentMethod> {
    return this.http.get<{ paymentMethod: PaymentMethod }>(
      `${this.baseUrl}/api/payment-methods/${id}`
    ).pipe(
      map(response => response.paymentMethod)
    );
  }

  /**
   * Create payment method
   */
  createPaymentMethod(paymentMethod: PaymentMethod): Observable<{ msg: string, paymentMethod: PaymentMethod }> {
    return this.http.post<{ msg: string, paymentMethod: PaymentMethod }>(
      `${this.baseUrl}/api/payment-methods`,
      paymentMethod
    );
  }

  /**
   * Update payment method
   */
  updatePaymentMethod(id: string, paymentMethod: PaymentMethod): Observable<{ msg: string, paymentMethod: PaymentMethod }> {
    return this.http.put<{ msg: string, paymentMethod: PaymentMethod }>(
      `${this.baseUrl}/api/payment-methods/${id}`,
      paymentMethod
    );
  }

  /**
   * Delete payment method
   */
  deletePaymentMethod(id: string): Observable<{ msg: string }> {
    return this.http.delete<{ msg: string }>(
      `${this.baseUrl}/api/payment-methods/${id}`
    );
  }

  /**
   * Toggle payment method active status
   */
  togglePaymentMethodStatus(id: string, isActive: boolean): Observable<{ msg: string, paymentMethod: PaymentMethod }> {
    return this.http.put<{ msg: string, paymentMethod: PaymentMethod }>(
      `${this.baseUrl}/api/payment-methods/${id}`,
      { isActive }
    );
  }
}
