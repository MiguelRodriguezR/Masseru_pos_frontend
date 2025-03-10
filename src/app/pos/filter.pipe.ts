import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) return [];
    if (!searchText) return items;
    
    searchText = searchText.toLowerCase();
    
    return items.filter(item => {
      // Search by name
      const nameMatch = item.name && item.name.toLowerCase().includes(searchText);
      
      // Search by barcode
      const barcodeMatch = item.barcode && item.barcode.toLowerCase().includes(searchText);
      
      // Return true if either name or barcode matches
      return nameMatch || barcodeMatch;
    });
  }
}
