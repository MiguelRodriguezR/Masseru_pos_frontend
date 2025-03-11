import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Sale } from './sale.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getSales(filters?: { startDate?: string, endDate?: string }): Observable<Sale[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.startDate) {
        params = params.set('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params = params.set('endDate', filters.endDate);
      }
    }
    
    return this.http.get<Sale[]>(`${this.baseUrl}/api/sales`, { params });
  }

  getSale(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.baseUrl}/api/sales/${id}`);
  }

  createSale(saleData: { 
    items: any[], 
    paymentMethod: string, 
    paymentAmount: number 
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/sales`, saleData);
  }

  getStats(filter: { startDate: string, endDate: string, productId?: string }): Observable<any> {
    let params = new HttpParams()
      .set('startDate', filter.startDate)
      .set('endDate', filter.endDate);
    if(filter.productId) {
      params = params.set('productId', filter.productId);
    }
    return this.http.get(`${this.baseUrl}/api/stats/sales`, { params });
  }
}
