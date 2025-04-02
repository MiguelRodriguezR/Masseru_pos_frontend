import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Purchase } from './purchase.model';
import { BaseService } from '../shared/base.service';
import { EnvironmentService } from '../shared/environment.service';

export interface PaginatedPurchases {
  purchases: Purchase[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseService extends BaseService implements OnDestroy {
  constructor(
    private http: HttpClient,
    protected override environmentService: EnvironmentService
  ) {
    super(environmentService);
  }

  getPurchases(page: number = 1, limit: number = 10, search: string = ''): Observable<PaginatedPurchases> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    // Add search parameter if provided
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get<PaginatedPurchases>(`${this.baseUrl}/api/purchases`, { params });
  }

  getPurchase(id: string): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.baseUrl}/api/purchases/${id}`);
  }

  createPurchase(purchase: Purchase): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/purchases`, purchase);
  }

  updatePurchase(id: string, purchase: Purchase): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/purchases/${id}`, purchase);
  }

  deletePurchase(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/purchases/${id}`);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
