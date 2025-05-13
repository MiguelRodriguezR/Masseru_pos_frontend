import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PosSessionService } from '../pos-session.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pos-session-detail',
  templateUrl: './pos-session-detail.component.html',
  styleUrls: ['./pos-session-detail.component.scss']
})
export class PosSessionDetailComponent implements OnInit, OnDestroy {
  // Track all subscriptions for cleanup
  private subscriptions: Subscription[] = [];
  
  // Session data
  sessionId: string = '';
  sessionData: any = null;
  
  // UI state
  isLoading: boolean = true;
  errorMessage: string = '';
  
  // Sales table
  displayedColumns: string[] = [
    'id', 
    'date', 
    'items', 
    'paymentMethods', 
    'totalAmount', 
    'actions'
  ];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private posSessionService: PosSessionService
  ) {}

  ngOnInit(): void {
    // Get session ID from route params
    const subscription = this.route.params.subscribe(params => {
      this.sessionId = params['id'];
      this.loadSessionData();
    });
    
    this.subscriptions.push(subscription);
  }

  /**
   * Load session data from API
   */
  loadSessionData(): void {
    if (!this.sessionId) {
      this.errorMessage = 'ID de sesión no válido';
      this.isLoading = false;
      return;
    }

    const subscription = this.posSessionService.getSessionById(this.sessionId).subscribe({
      next: (data) => {
        this.sessionData = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar la sesión:', error);
        this.errorMessage = 'Error al cargar la información de la sesión';
        this.isLoading = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información de la sesión'
        });
      }
    });
    
    this.subscriptions.push(subscription);
  }

  /**
   * Format currency for display
   * @param amount Amount to format
   * @returns Formatted currency string
   */
  formatCurrency(amount: number | undefined | null): string {
    if (amount === undefined || amount === null) return 'N/A';
    
    return amount.toLocaleString('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0
    });
  }

  /**
   * Get status badge class based on session status
   * @param status Session status
   * @returns CSS class for the badge
   */
  getStatusBadgeClass(status: string): string {
    return status === 'open' ? 'status-open' : 'status-closed';
  }


  /**
   * Navigate to sale detail
   * @param saleId Sale ID
   */
  viewSaleDetail(saleId: string): void {
    this.router.navigate(['/sales', saleId]);
  }

  /**
   * Navigate back to sessions list
   */
  goBack(): void {
    this.router.navigate(['/pos/sessions']);
  }

  /**
   * Get cash difference class based on amount
   * @param difference Cash difference amount
   * @returns CSS class for the difference
   */
  getCashDifferenceClass(difference: number): string {
    if (difference === undefined || difference === null) return '';
    
    if (difference > 0) return 'positive-difference';
    if (difference < 0) return 'negative-difference';
    return '';
  }

  /**
   * Cleanup subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.subscriptions.forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
  }
}
