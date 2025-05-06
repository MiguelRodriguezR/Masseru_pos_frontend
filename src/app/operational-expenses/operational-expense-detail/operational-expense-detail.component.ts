import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OperationalExpenseService } from '../operational-expense.service';
import { OperationalExpense } from '../operational-expense.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-operational-expense-detail',
  templateUrl: './operational-expense-detail.component.html',
  styleUrls: ['./operational-expense-detail.component.scss']
})
export class OperationalExpenseDetailComponent implements OnInit, OnDestroy {
  operationalExpense: OperationalExpense | null = null;
  loading: boolean = true;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private operationalExpenseService: OperationalExpenseService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadOperationalExpense();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOperationalExpense(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID no válido';
      this.loading = false;
      return;
    }

    this.operationalExpenseService.getOperationalExpense(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (operationalExpense) => {
          this.operationalExpense = operationalExpense;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al cargar el gasto operativo';
          this.loading = false;
          this.snackBar.open('Error al cargar el gasto operativo', 'Cerrar', { duration: 3000 });
        }
      });
  }

  editOperationalExpense(): void {
    if (this.operationalExpense?._id) {
      this.router.navigate(['/operational-expenses/edit', this.operationalExpense._id]);
    }
  }

  deleteOperationalExpense(): void {
    if (!this.operationalExpense?._id) return;

    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Está seguro de eliminar este gasto operativo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.operationalExpense?._id) {
        this.loading = true;
        this.operationalExpenseService.deleteOperationalExpense(this.operationalExpense._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire(
                'Eliminado',
                'Gasto operativo eliminado con éxito',
                'success'
              );
              this.router.navigate(['/operational-expenses']);
            },
            error: (err) => {
              console.error(err);
              this.loading = false;
              Swal.fire(
                'Error',
                'Error al eliminar el gasto operativo',
                'error'
              );
            }
          });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/operational-expenses']);
  }

  // Format date to a readable format
  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format currency
  formatCurrency(amount: number | undefined): string {
    if (amount === undefined) return 'N/A';
    return amount.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });
  }
}
