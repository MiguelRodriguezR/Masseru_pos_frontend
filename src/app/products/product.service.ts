import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Product, Variant } from './product.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get the full URL for a product image
   * @param imagePath The image path or URL
   * @returns The full URL for the image
   */
  getImageUrl(imagePath: string): string {
    // If the image path is already a full URL, return it as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Otherwise, prepend the baseUrl
    return `${this.baseUrl}${imagePath}`;
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/api/products`);
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/api/products/${id}`);
  }

  createProduct(productData: FormData): Observable<any> {
    // For debugging - log the FormData contents
    this.logFormData(productData);
    
    return this.http.post(`${this.baseUrl}/api/products`, productData);
  }

  updateProduct(id: string, productData: FormData): Observable<any> {
    // For debugging - log the FormData contents
    this.logFormData(productData);
    
    return this.http.put(`${this.baseUrl}/api/products/${id}`, productData);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/products/${id}`);
  }

  addStock(id: string, quantity: number, variant?: { color: string, size: string }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/api/products/${id}/stock`, { quantity, variant });
  }
  
  // Helper method to create a product with JSON instead of FormData
  createProductWithJSON(product: Product, files: File[]): Observable<any> {
    const formData = new FormData();
    
    // Add the product data as a JSON string
    formData.append('product', JSON.stringify({
      salePrice: product.salePrice,
      purchaseCost: product.purchaseCost,
      barcode: product.barcode,
      name: product.name,
      description: product.description || '',
      quantity: product.quantity,
      variants: product.variants || []
    }));
    
    // Add image files
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('images', file);
      });
    }
    
    return this.createProduct(formData);
  }
  
  // Helper method to update a product with JSON instead of FormData
  updateProductWithJSON(id: string, product: Partial<Product>, files: File[], keepImages: boolean): Observable<any> {
    const formData = new FormData();
    
    // Add the product data as a JSON string
    formData.append('product', JSON.stringify({
      ...product,
      variants: product.variants || []
    }));
    
    // Add keepImages flag
    formData.append('keepImages', keepImages.toString());
    
    // Add image files
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('images', file);
      });
    }
    
    return this.updateProduct(id, formData);
  }
  
  // Helper method to log FormData contents for debugging
  private logFormData(formData: FormData): void {
    console.log('FormData contents:');
    for (const pair of (formData as any).entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
  }
}
