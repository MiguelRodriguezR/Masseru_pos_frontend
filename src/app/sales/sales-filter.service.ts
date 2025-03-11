import { Injectable } from '@angular/core';
import { SaleFilters } from './sale.service';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class SalesFilterService {
  // Estado de los filtros
  private filters: SaleFilters = {};
  
  // Estado de la búsqueda
  private _searchTerm: string = '';
  
  // Estado de las opciones de filtro
  private _filterOptions: { value: string, label: string, selected: boolean }[] = [
    { value: 'productName', label: 'Nombre de producto', selected: true },
    { value: 'productBarcode', label: 'Código de barras', selected: false },
    { value: 'totalAmount', label: 'Valor total', selected: false }
  ];
  
  // Estado de la paginación
  private _currentPage: number = 1;
  private _pageSize: number = 10;
  
  // Estado del formulario de filtros
  private _formValues: any = {
    startDate: '',
    endDate: ''
  };

  constructor() { }

  /**
   * Guarda los filtros actuales
   */
  saveFilters(filters: SaleFilters): void {
    this.filters = { ...filters };
  }
  
  /**
   * Guarda los valores del formulario de filtros
   */
  saveFormValues(formValues: any): void {
    this._formValues = { ...formValues };
  }
  
  /**
   * Obtiene los valores del formulario de filtros guardados
   */
  get formValues(): any {
    return { ...this._formValues };
  }

  /**
   * Obtiene los filtros guardados
   */
  getFilters(): SaleFilters {
    return { ...this.filters };
  }

  /**
   * Guarda el término de búsqueda
   */
  set searchTerm(term: string) {
    this._searchTerm = term;
  }

  /**
   * Obtiene el término de búsqueda guardado
   */
  get searchTerm(): string {
    return this._searchTerm;
  }

  /**
   * Guarda las opciones de filtro
   */
  set filterOptions(options: { value: string, label: string, selected: boolean }[]) {
    this._filterOptions = [...options];
  }

  /**
   * Obtiene las opciones de filtro guardadas
   */
  get filterOptions(): { value: string, label: string, selected: boolean }[] {
    return [...this._filterOptions];
  }

  /**
   * Guarda la página actual
   */
  set currentPage(page: number) {
    this._currentPage = page;
  }

  /**
   * Obtiene la página actual guardada
   */
  get currentPage(): number {
    return this._currentPage;
  }

  /**
   * Guarda el tamaño de página
   */
  set pageSize(size: number) {
    this._pageSize = size;
  }

  /**
   * Obtiene el tamaño de página guardado
   */
  get pageSize(): number {
    return this._pageSize;
  }

  /**
   * Reinicia todos los filtros a sus valores por defecto
   */
  resetFilters(): void {
    this.filters = {};
    this._searchTerm = '';
    this._filterOptions = [
      { value: 'productName', label: 'Nombre de producto', selected: true },
      { value: 'productBarcode', label: 'Código de barras', selected: false },
      { value: 'totalAmount', label: 'Valor total', selected: false }
    ];
    this._currentPage = 1;
    this._pageSize = 10;
  }
}
