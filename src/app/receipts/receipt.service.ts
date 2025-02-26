import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getReceipt(saleId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/receipts/${saleId}`);
  }
}
