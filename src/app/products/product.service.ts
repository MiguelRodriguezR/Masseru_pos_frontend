import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from './product.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/api/products`);
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/api/products/${id}`);
  }

  createProduct(product: Product): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/products`, product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/products/${id}`, product);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/products/${id}`);
  }

  addStock(id: string, quantity: number, variant?: { color: string, size: string }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/api/products/${id}/stock`, { quantity, variant });
  }
}
