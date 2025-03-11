import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { delay, tap, catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los datos de un recibo
   * @param saleId ID de la venta
   * @returns Observable con los datos del recibo
   */
  getReceipt(saleId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/receipts/${saleId}`);
  }

  /**
   * Genera un recibo para una venta
   * @param saleId ID de la venta
   * @returns Observable que emite cuando el recibo ha sido generado
   */
  generateReceipt(saleId: string): Observable<boolean> {
    // Mostrar mensaje de carga
    Swal.fire({
      title: 'Generando recibo',
      text: 'El recibo se está generando...',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false
    });
    
    // Llamada al backend para generar el recibo
    return this.http.post<any>(`${this.baseUrl}/api/receipts/${saleId}`, {}).pipe(
      tap(() => this.showSuccessMessage()),
      catchError(error => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo generar el recibo',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        console.error('Error generando recibo:', error);
        return of(false);
      })
    );
  }
  
  /**
   * Muestra un mensaje de éxito cuando el recibo ha sido generado
   */
  private showSuccessMessage(): void {
    Swal.fire({
      title: 'Recibo generado',
      text: 'El recibo se ha generado correctamente',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });
  }
}
