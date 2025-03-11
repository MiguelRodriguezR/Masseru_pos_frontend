import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { StatsService, StatsFilter } from './stats.service';
import { ProductService } from '../products/product.service';
import { Product } from '../products/product.model';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { formatCurrency, formatDate, getCurrencySymbol } from '@angular/common';
import Swal from 'sweetalert2';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef;
  @ViewChild('productSalesChart') productSalesChartRef!: ElementRef;
  @ViewChild('peakHoursChart') peakHoursChartRef!: ElementRef;
  @ViewChild('profitMarginChart') profitMarginChartRef!: ElementRef;
  @ViewChild('paymentMethodChart') paymentMethodChartRef!: ElementRef;
  
  // Chart instances
  salesChart: Chart | undefined;
  productSalesChart: Chart | undefined;
  peakHoursChart: Chart | undefined;
  profitMarginChart: Chart | undefined;
  paymentMethodChart: Chart | undefined;
  
  // Loading states
  loading = true;
  loadingProducts = true;
  loadingCustomers = true;
  loadingPosSession = true;
  
  // Filter form
  filterForm: FormGroup;
  products: Product[] = [];
  
  // Dashboard data
  salesStats: any = {};
  productStats: any = {};
  customerStats: any = {};
  posSessionStats: any = {};
  
  // Summary metrics
  totalSales = 0;
  totalProfit = 0;
  grossProfit = 0;
  netProfit = 0;
  averageTicket = 0;
  inventoryValue = 0;
  inventoryTurnover = 0;
  
  // Top products
  topSellingProducts: any[] = [];
  lowStockProducts: any[] = [];
  
  // Chart data
  salesChartData: any = {
    labels: [] as string[],
    datasets: [
      {
        label: 'Ventas diarias',
        data: [] as number[],
        borderColor: '#8a6bce',
        backgroundColor: 'rgba(138, 107, 206, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  productSalesChartData: any = {
    labels: [] as string[],
    datasets: [
      {
        label: 'Cantidad vendida',
        data: [] as number[],
        backgroundColor: '#8a6bce',
        borderColor: '#6a4fa0',
        borderWidth: 1
      }
    ]
  };
  
  peakHoursChartData: any = {
    labels: [] as string[],
    datasets: [
      {
        label: 'Ventas por hora',
        data: [] as number[],
        backgroundColor: '#4caf50',
        borderColor: '#388e3c',
        borderWidth: 1
      }
    ]
  };
  
  profitMarginChartData: any = {
    labels: ['Costo', 'Ganancia'],
    datasets: [
      {
        data: [0, 0] as number[],
        backgroundColor: ['#f44336', '#4caf50'],
        borderWidth: 1
      }
    ]
  };
  
  paymentMethodChartData: any = {
    labels: ['Efectivo', 'Tarjeta'],
    datasets: [
      {
        data: [0, 0] as number[],
        backgroundColor: ['#ff9800', '#2196f3'],
        borderWidth: 1
      }
    ]
  };
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private statsService: StatsService,
    private productService: ProductService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      productId: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadProducts();
    this.loadAllStats();
    
    // Listen for filter changes
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Debounce could be added here if needed
      });
  }
  
  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }
  
  ngOnDestroy(): void {
    // Destroy chart instances to prevent memory leaks
    if (this.salesChart) this.salesChart.destroy();
    if (this.productSalesChart) this.productSalesChart.destroy();
    if (this.peakHoursChart) this.peakHoursChart.destroy();
    if (this.profitMarginChart) this.profitMarginChart.destroy();
    if (this.paymentMethodChart) this.paymentMethodChart.destroy();
    
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadProducts(): void {
    this.productService.getProducts(1, 100) // Get up to 100 products for dashboard stats
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.products = response.products;
          this.loadingProducts = false;
        },
        error: (error) => {
          console.error('Error loading products', error);
          this.loadingProducts = false;
          this.showErrorAlert('Error al cargar productos');
        }
      });
  }
  
  loadAllStats(): void {
    this.loading = true;
    
    const filter: StatsFilter = {
      startDate: this.filterForm.get('startDate')?.value,
      endDate: this.filterForm.get('endDate')?.value,
      productId: this.filterForm.get('productId')?.value
    };
    
    this.statsService.getAllStats(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Process all stats data
          this.processSalesStats(data.salesStats);
          this.processProductStats(data.productStats);
          this.processCustomerStats(data.customerStats);
          this.processPosSessionStats(data.posSessionStats);
          
          // Calculate additional metrics
          this.calculateProfitMargins();
          this.calculateInventoryTurnover();
          this.calculateReinvestmentSuggestion();
          
          this.loading = false;
          
          // Initialize charts after data is loaded
          setTimeout(() => {
            this.initializeCharts();
          }, 0);
        },
        error: (error) => {
          console.error('Error loading dashboard stats', error);
          this.loading = false;
          this.showErrorAlert('Error al cargar estadísticas del dashboard');
          
          // Fallback to individual calls
          this.loadIndividualStats(filter);
        }
      });
  }
  
  loadIndividualStats(filter: StatsFilter): void {
    forkJoin({
      salesStats: this.statsService.getSalesStats(filter),
      productStats: this.statsService.getProductStats(filter),
      customerStats: this.statsService.getCustomerStats(filter),
      posSessionStats: this.statsService.getPosSessionStats(filter)
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.processSalesStats(data.salesStats);
        this.processProductStats(data.productStats);
        this.processCustomerStats(data.customerStats);
        this.processPosSessionStats(data.posSessionStats);
        
        this.calculateProfitMargins();
        this.calculateInventoryTurnover();
        this.calculateReinvestmentSuggestion();
        
        this.loading = false;
        
        // Initialize charts after data is loaded
        setTimeout(() => {
          this.initializeCharts();
        }, 0);
      },
      error: (error) => {
        console.error('Error loading individual stats', error);
        this.loading = false;
        this.showErrorAlert('Error al cargar estadísticas individuales');
      }
    });
  }
  
  initializeCharts(): void {
    // Only initialize charts if the elements exist
    if (this.salesChartRef && this.salesChartRef.nativeElement) {
      this.initSalesChart();
    }
    
    if (this.productSalesChartRef && this.productSalesChartRef.nativeElement) {
      this.initProductSalesChart();
    }
    
    if (this.peakHoursChartRef && this.peakHoursChartRef.nativeElement) {
      this.initPeakHoursChart();
    }
    
    if (this.profitMarginChartRef && this.profitMarginChartRef.nativeElement) {
      this.initProfitMarginChart();
    }
    
    if (this.paymentMethodChartRef && this.paymentMethodChartRef.nativeElement) {
      this.initPaymentMethodChart();
    }
  }
  
  initSalesChart(): void {
    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    
    // Destroy previous chart instance if it exists
    if (this.salesChart) {
      this.salesChart.destroy();
    }
    
    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: this.salesChartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
  }
  
  initProductSalesChart(): void {
    const ctx = this.productSalesChartRef.nativeElement.getContext('2d');
    
    // Destroy previous chart instance if it exists
    if (this.productSalesChart) {
      this.productSalesChart.destroy();
    }
    
    this.productSalesChart = new Chart(ctx, {
      type: 'bar',
      data: this.productSalesChartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  initPeakHoursChart(): void {
    const ctx = this.peakHoursChartRef.nativeElement.getContext('2d');
    
    // Destroy previous chart instance if it exists
    if (this.peakHoursChart) {
      this.peakHoursChart.destroy();
    }
    
    this.peakHoursChart = new Chart(ctx, {
      type: 'bar',
      data: this.peakHoursChartData,
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  initProfitMarginChart(): void {
    const ctx = this.profitMarginChartRef.nativeElement.getContext('2d');
    
    // Destroy previous chart instance if it exists
    if (this.profitMarginChart) {
      this.profitMarginChart.destroy();
    }
    
    this.profitMarginChart = new Chart(ctx, {
      type: 'doughnut',
      data: this.profitMarginChartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
  
  initPaymentMethodChart(): void {
    const ctx = this.paymentMethodChartRef.nativeElement.getContext('2d');
    
    // Destroy previous chart instance if it exists
    if (this.paymentMethodChart) {
      this.paymentMethodChart.destroy();
    }
    
    this.paymentMethodChart = new Chart(ctx, {
      type: 'pie',
      data: this.paymentMethodChartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
  
  applyFilter(): void {
    this.loadAllStats();
  }
  
  resetFilter(): void {
    this.filterForm.reset({
      startDate: '',
      endDate: '',
      productId: ''
    });
    this.loadAllStats();
  }
  
  processSalesStats(data: any): void {
    if (!data) return;
    
    this.salesStats = data;
    this.totalSales = data.totalSales || 0;
    this.totalProfit = data.totalProfit || 0;
    
    // Process sales data for charts if available
    if (data.sales && data.sales.length > 0) {
      this.processSalesChartData(data.sales);
    }
  }
  
  processProductStats(data: any): void {
    if (!data) return;
    
    this.productStats = data;
    this.topSellingProducts = data.topSellingProducts || [];
    this.lowStockProducts = data.lowStockProducts || [];
    this.inventoryValue = data.inventoryValue || 0;
    
    // Process product data for charts
    if (this.topSellingProducts.length > 0) {
      this.processProductSalesChartData(this.topSellingProducts.slice(0, 5));
    }
  }
  
  processCustomerStats(data: any): void {
    if (!data) return;
    
    this.customerStats = data;
    this.averageTicket = data.averageTicket || 0;
    
    // Process customer flow data for charts
    if (data.customerFlow && data.customerFlow.length > 0) {
      this.processSalesChartData(data.customerFlow);
    }
    
    // Process peak hours data for charts
    if (data.peakHours && data.peakHours.length > 0) {
      this.processPeakHoursChartData(data.peakHours);
    }
  }
  
  processPosSessionStats(data: any): void {
    if (!data) return;
    
    this.posSessionStats = data;
    
    // Update payment method chart data
    this.paymentMethodChartData.datasets[0].data = [
      data.totalCashSales || 0,
      data.totalCardSales || 0
    ];
    
    // Update chart if it exists
    if (this.paymentMethodChart) {
      this.paymentMethodChart.update();
    }
  }
  
  processSalesChartData(sales: any[]): void {
    // Group sales by date
    const salesByDate: Record<string, number> = {};
    
    sales.forEach(sale => {
      const date = sale.date || formatDate(sale.saleDate, 'yyyy-MM-dd', 'en');
      const count = sale.count || 1;
      
      if (!salesByDate[date]) {
        salesByDate[date] = 0;
      }
      salesByDate[date] += count;
    });
    
    // Sort dates
    const sortedDates = Object.keys(salesByDate).sort();
    
    // Update chart data
    this.salesChartData.labels = sortedDates.map(date => formatDate(date, 'dd/MM', 'en'));
    this.salesChartData.datasets[0].data = sortedDates.map(date => salesByDate[date]);
    
    // Update chart if it exists
    if (this.salesChart) {
      this.salesChart.update();
    }
  }
  
  processProductSalesChartData(products: any[]): void {
    this.productSalesChartData.labels = products.map(p => p.name);
    this.productSalesChartData.datasets[0].data = products.map(p => p.totalQuantity);
    
    // Update chart if it exists
    if (this.productSalesChart) {
      this.productSalesChart.update();
    }
  }
  
  processPeakHoursChartData(peakHours: any[]): void {
    // Format hours (e.g., "8:00", "9:00", etc.)
    this.peakHoursChartData.labels = peakHours.map(ph => `${ph.hour}:00`);
    this.peakHoursChartData.datasets[0].data = peakHours.map(ph => ph.count);
    
    // Update chart if it exists
    if (this.peakHoursChart) {
      this.peakHoursChart.update();
    }
  }
  
  calculateProfitMargins(): void {
    if (!this.salesStats.sales || this.salesStats.sales.length === 0) {
      return;
    }
    
    const margins = this.statsService.calculateProfitMargins(this.salesStats.sales);
    
    this.grossProfit = margins.grossProfit;
    
    // Estimate net profit (simplified - in a real app you'd include more expenses)
    // Assuming operating expenses are about 30% of gross profit
    const operatingExpenses = this.grossProfit * 0.3;
    this.netProfit = this.grossProfit - operatingExpenses;
    
    // Update profit margin chart data
    this.profitMarginChartData.datasets[0].data = [
      margins.totalCost,
      margins.grossProfit
    ];
    
    // Update chart if it exists
    if (this.profitMarginChart) {
      this.profitMarginChart.update();
    }
  }
  
  calculateInventoryTurnover(): void {
    if (!this.salesStats.sales || !this.products) {
      return;
    }
    
    this.inventoryTurnover = this.statsService.calculateInventoryTurnover(
      this.salesStats.sales,
      this.products
    );
  }
  
  calculateReinvestmentSuggestion(): void {
    // Simple reinvestment suggestion based on profit and inventory
    // In a real app, this would be more sophisticated
    if (this.netProfit <= 0 || !this.lowStockProducts) {
      return;
    }
    
    // Suggest reinvesting 40% of net profit into inventory
    const reinvestmentAmount = this.netProfit * 0.4;
    
    // Prioritize low stock products
    if (this.lowStockProducts.length > 0) {
      const criticalProducts = this.getCriticalProductsText();
      
      if (criticalProducts) {
        // This would be displayed in the UI
        console.log(`Sugerencia: Reinvertir ${reinvestmentAmount.toLocaleString('es', {style: 'currency', currency: 'COP'})} en inventario, priorizando: ${criticalProducts}`);
      }
    }
  }
  
  getCriticalProductsText(): string {
    if (!this.lowStockProducts || this.lowStockProducts.length === 0) {
      return '';
    }
    
    const criticalProducts = this.lowStockProducts
      .filter(p => p.quantity < 5)
      .slice(0, 3);
      
    return criticalProducts.map(p => p.name).join(', ');
  }
  
  showErrorAlert(message: string): void {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'OK'
    });
  }
}
