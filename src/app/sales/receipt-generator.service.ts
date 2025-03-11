import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReceiptService } from '../receipts/receipt.service';

/**
 * @deprecated Use ReceiptService instead
 */
@Injectable({
  providedIn: 'root'
})
export class ReceiptGeneratorService {

  constructor(private receiptService: ReceiptService) { }

  /**
   * @deprecated Use ReceiptService.generateReceipt instead
   */
  generateReceipt(saleId: string): Observable<boolean> {
    return this.receiptService.generateReceipt(saleId);
  }
  
  /**
   * @deprecated This method is now handled internally by ReceiptService
   */
  showSuccessMessage(): void {
    // This method is now handled internally by ReceiptService
    console.warn('ReceiptGeneratorService is deprecated. Use ReceiptService instead.');
  }
}
