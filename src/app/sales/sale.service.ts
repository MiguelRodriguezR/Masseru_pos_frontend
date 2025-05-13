import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Sale } from './sale.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaginatedSales {
  sales: Sale[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SaleFilters {
  startDate?: string;
  endDate?: string;
  search?: string;
  filterBy?: string[];
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getSales(filters?: SaleFilters): Observable<PaginatedSales> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.startDate) {
        params = params.set('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params = params.set('endDate', filters.endDate);
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.limit) {
        params = params.set('limit', filters.limit.toString());
      }
      if (filters.filterBy && filters.filterBy.length > 0) {
        filters.filterBy.forEach(filter => {
          params = params.append('filterBy', filter);
        });
      }
    }
    
    return this.http.get<PaginatedSales>(`${this.baseUrl}/api/sales`, { params });
  }

  getSale(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.baseUrl}/api/sales/${id}`);
  }

  createSale(saleData: { 
    items: { 
      productId: string, 
      quantity: number, 
      discounts?: { type: 'percentage' | 'fixed', value: number }[] 
    }[], 
    paymentDetails: { 
      paymentMethod: string, 
      amount: number 
    }[] 
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
