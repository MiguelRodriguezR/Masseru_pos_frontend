import { Component, OnInit } from '@angular/core';
import { SaleService } from '../sales/sale.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  totalSales: number = 0;
  totalProfit: number = 0;
  sales = [];
  filter = {
    startDate: '',
    endDate: '',
    productId: ''
  };

  constructor(private saleService: SaleService) {}

  ngOnInit(): void {
    this.getStats();
  }

  getStats() {
    // Implementa la obtención de estadísticas a través de saleService.getStats()
    // Ejemplo:
    // this.saleService.getStats(this.filter).subscribe(res => {
    //   this.totalSales = res.totalSales;
    //   this.totalProfit = res.totalProfit;
    //   this.sales = res.sales;
    // });
  }
}
