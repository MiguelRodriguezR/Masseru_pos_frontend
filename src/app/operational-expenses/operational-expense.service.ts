import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OperationalExpense } from './operational-expense.model';
import { BaseService } from '../shared/base.service';
import { EnvironmentService } from '../shared/environment.service';

export interface PaginatedOperationalExpenses {
  operationalExpenses: OperationalExpense[];
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
export class OperationalExpenseService extends BaseService implements OnDestroy {
  constructor(
    private http: HttpClient,
    protected override environmentService: EnvironmentService
  ) {
    super(environmentService);
  }

  getOperationalExpenses(page: number = 1, limit: number = 10, search: string = ''): Observable<PaginatedOperationalExpenses> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    // Add search parameter if provided
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get<PaginatedOperationalExpenses>(`${this.baseUrl}/api/operational-expenses`, { params });
  }

  getOperationalExpense(id: string): Observable<OperationalExpense> {
    return this.http.get<OperationalExpense>(`${this.baseUrl}/api/operational-expenses/${id}`);
  }

  createOperationalExpense(operationalExpense: OperationalExpense): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/operational-expenses`, operationalExpense);
  }

  updateOperationalExpense(id: string, operationalExpense: OperationalExpense): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/operational-expenses/${id}`, operationalExpense);
  }

  deleteOperationalExpense(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/operational-expenses/${id}`);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
