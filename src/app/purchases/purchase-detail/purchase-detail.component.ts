import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseService } from '../purchase.service';
import { Purchase } from '../purchase.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-detail',
  templateUrl: './purchase-detail.component.html',
  styleUrls: ['./purchase-detail.component.scss']
})
export class PurchaseDetailComponent implements OnInit, OnDestroy {
  purchase: Purchase | null = null;
  loading: boolean = false;
  purchaseId: string = '';
  
  // Subject for unsubscribing observables
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchaseService: PurchaseService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.purchaseId = this.route.snapshot.paramMap.get('id') || '';
    if (this.purchaseId) {
      this.loadPurchase();
    } else {
      this.snackBar.open('ID de compra no válido', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/purchases']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPurchase(): void {
    this.loading = true;
    this.purchaseService.getPurchase(this.purchaseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (purchase: Purchase) => {
          this.purchase = purchase;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al cargar la compra', 'Cerrar', { duration: 3000 });
          this.loading = false;
          this.router.navigate(['/purchases']);
        }
      });
  }

  editPurchase(): void {
    this.router.navigate(['/purchases/edit', this.purchaseId]);
  }

  deletePurchase(): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Está seguro de eliminar esta compra?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.purchaseService.deletePurchase(this.purchaseId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire(
                'Eliminada',
                'Compra eliminada con éxito',
                'success'
              );
              this.router.navigate(['/purchases']);
            },
            error: (err) => {
              console.error(err);
              Swal.fire(
                'Error',
                'Error al eliminar la compra',
                'error'
              );
              this.loading = false;
            }
          });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/purchases']);
  }

  // Format date to a readable format
  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
