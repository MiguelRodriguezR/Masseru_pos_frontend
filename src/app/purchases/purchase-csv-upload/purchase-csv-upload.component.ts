import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, from, mergeMap, of, tap } from 'rxjs';
import { ProductService } from '../../products/product.service';
import { PurchaseService } from '../purchase.service';

interface CsvRow {
  productName: string;
  barcode: string;
  quantity: number;
  cost: number;
  salePrice: number;
  provider: string;
  notes: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-purchase-csv-upload',
  standalone: true,
  imports: [CommonModule, HttpClientModule, MatProgressBarModule],
  templateUrl: './purchase-csv-upload.component.html',
  styleUrl: './purchase-csv-upload.component.scss'
})
export class PurchaseCsvUploadComponent {
  selectedFileName: string | null = null;
  selectedFile: File | null = null;
  isProcessing = false;
  progress = 0;
  totalRows = 0;
  processedRows = 0;
  
  @Output() fileReady = new EventEmitter<File>();
  @Output() processingComplete = new EventEmitter<{success: number, errors: number}>();

  private productService = inject(ProductService);
  private purchaseService = inject(PurchaseService);

  constructor(
    private snackBar: MatSnackBar
  ) {}

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
      this.selectedFileName = this.selectedFile.name;
      console.log('Archivo seleccionado:', this.selectedFile);
      this.fileReady.emit(this.selectedFile);
    } else {
      this.selectedFile = null;
      this.selectedFileName = null;
    }
  }

  processFile(): Promise<{success: number, errors: number}> {
    if (!this.selectedFile) {
      this.snackBar.open('No se ha seleccionado ningún archivo', 'Cerrar', { duration: 3000 });
      return Promise.reject('No file selected');
    }

    this.isProcessing = true;
    this.progress = 0;
    this.processedRows = 0;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          
          const csvData = e.target.result;
          const rows = this.parseCSV(csvData);

          // console.log({csvData, rows});
          this.totalRows = rows.length;
          
          if (rows.length === 0) {
            this.snackBar.open('El archivo CSV está vacío o tiene un formato incorrecto', 'Cerrar', { duration: 3000 });
            this.isProcessing = false;
            reject('Empty or invalid CSV');
            return;
          }
          
          let successCount = 0;
          let errorCount = 0;
          
          // Process each row sequentially
          from(rows).pipe(
            // Process one row at a time
            mergeMap((row, index) => {
              return this.processRow(row).pipe(
                tap(() => {
                  successCount++;
                  this.processedRows++;
                  this.progress = (this.processedRows / this.totalRows) * 100;
                }),
                catchError(error => {
                  console.error('Error processing row:', row, error);
                  errorCount++;
                  this.processedRows++;
                  this.progress = (this.processedRows / this.totalRows) * 100;
                  return of(null); // Continue with next row despite error
                })
              );
            }, 1), // concurrency of 1 to process sequentially
            finalize(() => {
              this.isProcessing = false;
              const result = { success: successCount, errors: errorCount };
              this.processingComplete.emit(result);
              resolve(result);
            })
          ).subscribe();
          
        } catch (error) {
          console.error('Error processing CSV:', error);
          this.snackBar.open('Error al procesar el archivo CSV', 'Cerrar', { duration: 3000 });
          this.isProcessing = false;
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        this.snackBar.open('Error al leer el archivo', 'Cerrar', { duration: 3000 });
        this.isProcessing = false;
        reject(error);
      };
      
      // Ensure selectedFile is not null before reading
      if (this.selectedFile) {
        reader.readAsText(this.selectedFile);
      } else {
        this.isProcessing = false;
        reject('No file selected');
      }
    });
  }

  private parseCSV(csvData: string): CsvRow[] {
    const lines = csvData.split('\n');
    const result: CsvRow[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line handling quoted values with commas
      const columns: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      columns.push(current.trim()); // Add last column
      
      if (columns.length < 5) continue;
      
      const productName = columns[0];
      const barcode = columns[1];
      const quantityStr = columns[2];
      const costStr = columns[3].replace('$', '').replace(/\./g, '').replace(',', '.');
      const salePriceStr = columns[4].replace('$', '').replace(/\./g, '').replace(',', '.');
      
      const quantity = parseInt(quantityStr, 10);
      const cost = parseFloat(costStr);
      const salePrice = parseFloat(salePriceStr);
      const provider = columns[5];
      const notes = columns[6];
      const imageUrl = columns[7] || undefined;
      
      if (isNaN(quantity) || isNaN(cost) || isNaN(salePrice)) {
        console.warn('Invalid numeric values in row:', i + 1);
        continue;
      }
      
      result.push({
        productName,
        barcode,
        quantity,
        cost,
        salePrice,
        provider,
        notes,
        imageUrl
      });
    }
    
    return result;
  }

  private async downloadImage(url: string): Promise<File | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to download image from ${url}: ${response.statusText}`);
        return null;
      }
      
      const blob = await response.blob();
      const fileName = `image-${Date.now()}.png`;
      return new File([blob], fileName, { type: blob.type });
    } catch (error) {
      console.error(`Error downloading image from ${url}:`, error);
      return null;
    }
  }

  private processRow(row: CsvRow) {
    return from(this.processRowAsync(row));
  }

  private async processRowAsync(row: CsvRow) {
    try {
      let imageFiles: File[] = [];
      
      if (row.imageUrl) {
        const imageFile = await this.downloadImage(row.imageUrl);
        if (imageFile) {
          imageFiles.push(imageFile);
        }
      }

      console.log({imageFiles})

      const productData = {
        name: row.productName,
        barcode: row.barcode,
        purchaseCost: row.cost,
        salePrice: row.salePrice,
        quantity: 0,
        description: '',
        images: [],
        variants: []
      };

      const purchaseData = {
        supplier: row.provider,
        invoiceNumber: `${row.productName}-${row.barcode}-CSV-${new Date().getTime()}`,
        notes: row.notes,
        items: [{
          product: {
            _id: '',
            name: row.productName,
            barcode: row.barcode,
            salePrice: row.salePrice,
            purchaseCost: row.cost
          },
          quantity: row.quantity,
          purchasePrice: row.cost
        }],
        total: row.quantity * row.cost
      };

      const productResponse = await this.productService.createProductWithJSON(productData, imageFiles).toPromise();
      if (!productResponse) {
        throw new Error('Failed to create product');
      }

      purchaseData.items[0].product._id = productResponse.product._id;

      await this.purchaseService.createPurchase(purchaseData).toPromise();
    } catch (error) {
      console.error('Error processing row:', row, error);
      throw error; // Re-throw to ensure the Observable chain gets the error
    }
  }
}
