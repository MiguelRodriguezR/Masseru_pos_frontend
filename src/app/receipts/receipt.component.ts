import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReceiptService } from './receipt.service';

@Component({
  selector: 'app-receipt',
  templateUrl: './receipt.component.html'
})
export class ReceiptComponent implements OnInit {
  receipt: any;

  constructor(private route: ActivatedRoute, private receiptService: ReceiptService) {}

  ngOnInit(): void {
    const saleId = this.route.snapshot.paramMap.get('saleId');
    if(saleId) {
      this.receiptService.getReceipt(saleId).subscribe({
        next: (data) => this.receipt = data,
        error: (err) => console.error(err)
      });
    }
  }
}
