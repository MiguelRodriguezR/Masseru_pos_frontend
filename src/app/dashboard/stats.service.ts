import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../products/product.model';

export interface StatsFilter {
  startDate?: string;
  endDate?: string;
  productId?: string;
}

export interface SalesStats {
  totalSales: number;
  totalProfit: number;
  sales: any[];
}

export interface ProductStats {
  topSellingProducts: any[];
  lowStockProducts: any[];
  productCategories: any[];
  inventoryValue: number;
}

export interface CustomerStats {
  peakHours: any[];
  customerFlow: any[];
  averageTicket: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get sales statistics
   */
  getSalesStats(filter: StatsFilter = {}): Observable<SalesStats> {
    let params = new HttpParams();
    
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }
    if (filter.productId) {
      params = params.set('productId', filter.productId);
    }
    
    return this.http.get<SalesStats>(`${this.baseUrl}/api/stats/sales`, { params });
  }

  /**
   * Get product statistics
   */
  getProductStats(filter: StatsFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }
    
    return this.http.get<any>(`${this.baseUrl}/api/stats/products`, { params });
  }

  /**
   * Get POS session statistics
   */
  getPosSessionStats(filter: StatsFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }
    
    return this.http.get<any>(`${this.baseUrl}/api/stats/pos-sessions`, { params });
  }

  /**
   * Get customer flow and peak hours statistics
   */
  getCustomerStats(filter: StatsFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }
    
    return this.http.get<any>(`${this.baseUrl}/api/stats/customers`, { params });
  }

  /**
   * Get all dashboard statistics in a single call
   */
  getAllStats(filter: StatsFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }
    if (filter.productId) {
      params = params.set('productId', filter.productId);
    }
    
    // Use the combined dashboard endpoint if available
    return this.http.get<any>(`${this.baseUrl}/api/stats/dashboard`, { params })
      .pipe(
        catchError((error: any) => {
          // Fallback to separate calls if the combined endpoint fails
          console.warn('Dashboard endpoint failed, falling back to separate calls', error);
          return forkJoin({
            salesStats: this.getSalesStats(filter),
            productStats: this.getProductStats(filter),
            customerStats: this.getCustomerStats(filter),
            posSessionStats: this.getPosSessionStats(filter)
          });
        })
      );
  }

  /**
   * Generate customer flow data from sales
   */
  private generateCustomerFlowData(sales: any[]): any[] {
    // Group sales by date
    const salesByDate: Record<string, number> = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.saleDate).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = 0;
      }
      salesByDate[date]++;
    });
    
    // Convert to array format for charts
    return Object.entries(salesByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate profit margins
   */
  calculateProfitMargins(sales: any[]): any {
    let totalRevenue = 0;
    let totalCost = 0;
    
    sales.forEach(sale => {
      sale.items.forEach((item: any) => {
        if (item.product && item.product.purchaseCost) {
          totalRevenue += item.salePrice * item.quantity;
          totalCost += item.product.purchaseCost * item.quantity;
        }
      });
    });
    
    const grossProfit = totalRevenue - totalCost;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalCost,
      grossProfit,
      grossMargin
    };
  }

  /**
   * Calculate inventory turnover
   */
  calculateInventoryTurnover(sales: any[], products: Product[]): number {
    // This is a simplified calculation
    // Ideally would use average inventory value over time
    const soldItems: Record<string, number> = {};
    
    sales.forEach(sale => {
      sale.items.forEach((item: any) => {
        if (!soldItems[item.product._id]) {
          soldItems[item.product._id] = 0;
        }
        soldItems[item.product._id] += item.quantity;
      });
    });
    
    const totalSold = Object.values(soldItems).reduce((sum, qty) => sum + qty, 0);
    const totalInventory = products.reduce((sum, product) => sum + product.quantity, 0);
    
    return totalInventory > 0 ? totalSold / totalInventory : 0;
  }
}
