import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PosSessionService, SessionFilters } from '../pos-session.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pos-session-list',
  templateUrl: './pos-session-list.component.html',
  styleUrls: ['./pos-session-list.component.scss']
})
export class PosSessionListComponent implements OnInit, OnDestroy {
  // Track all subscriptions for cleanup
  private subscriptions: Subscription[] = [];
  
  // Paginator
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  // Sessions data
  sessions: any[] = [];
  totalSessions: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 0;
  
  // Filter form
  filterForm: FormGroup;
  
  // UI state
  isLoading: boolean = true;
  displayedColumns: string[] = [
    'id', 
    'user', 
    'openingDate', 
    'closingDate', 
    'initialCash', 
    'totalSales', 
    'status', 
    'actions'
  ];
  
  constructor(
    private posSessionService: PosSessionService,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Initialize filter form
    this.filterForm = this.fb.group({
      search: [''],
      startDate: [''],
      endDate: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.loadSessions();
    
    // Subscribe to filter form changes
    const formSubscription = this.filterForm.get('search')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadSessions();
      });
    
    if (formSubscription) {
      this.subscriptions.push(formSubscription);
    }
  }

  /**
   * Load sessions with current filters and pagination
   */
  loadSessions(): void {
    this.isLoading = true;
    
    // Prepare filters
    const filters: SessionFilters = {
      page: this.currentPage,
      limit: this.pageSize
    };
    
    // Add form filters if they exist
    const formValues = this.filterForm.value;
    if (formValues.search) {
      filters.search = formValues.search;
    }
    if (formValues.startDate) {
      filters.startDate = new Date(formValues.startDate).toISOString();
    }
    if (formValues.endDate) {
      filters.endDate = new Date(formValues.endDate).toISOString();
    }
    if (formValues.status) {
      filters.status = formValues.status;
    }
    
    // Load sessions with filters
    const subscription = this.posSessionService.getAllSessions(filters).subscribe({
      next: (response) => {
        this.sessions = response.sessions;
        this.totalSessions = response.pagination.total;
        this.totalPages = response.pagination.pages;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading POS sessions:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar las sesiones de POS'
        });
      }
    });
    
    this.subscriptions.push(subscription);
  }

  /**
   * Apply filters from form
   */
  applyFilters(): void {
    this.currentPage = 1;
    this.loadSessions();
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      startDate: '',
      endDate: '',
      status: ''
    });
    this.currentPage = 1;
    this.loadSessions();
  }

  /**
   * Handle page change event
   * @param event Page event
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSessions();
  }

  /**
   * View session details
   * @param sessionId Session ID
   */
  viewSessionDetails(sessionId: string): void {
    this.router.navigate(['/pos/session-detail', sessionId]);
  }

  /**
   * Format currency for display
   * @param amount Amount to format
   * @returns Formatted currency string
   */
  formatCurrency(amount: number): string {
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
