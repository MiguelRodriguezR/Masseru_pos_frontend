import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Sale } from '../sale.model';
import { SaleService } from '../sale.service';

@Component({
  selector: 'app-sale-detail',
  templateUrl: './sale-detail.component.html'
})
export class SaleDetailComponent implements OnInit {
  sale?: Sale;

  constructor(private route: ActivatedRoute, private saleService: SaleService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if(id) {
      this.saleService.getSale(id).subscribe({
        next: (data) => this.sale = data,
        error: (err) => console.error(err)
      });
    }
  }
}
