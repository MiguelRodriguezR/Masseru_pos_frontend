import { Component, OnInit } from '@angular/core';
import { SaleService } from '../sale.service';
import { Sale } from '../sale.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sale-list',
  templateUrl: './sale-list.component.html'
})
export class SaleListComponent implements OnInit {
  sales: Sale[] = [];

  constructor(private saleService: SaleService, private router: Router) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales() {
    this.saleService.getSales().subscribe({
      next: (data) => this.sales = data,
      error: (err) => console.error(err)
    });
  }

  viewSale(id: string) {
    this.router.navigate(['/sales', id]);
  }
}
