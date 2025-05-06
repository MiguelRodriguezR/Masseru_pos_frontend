import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OperationalExpenseService } from '../operational-expense.service';
import { OperationalExpense } from '../operational-expense.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-operational-expense-form',
  templateUrl: './operational-expense-form.component.html',
  styleUrls: ['./operational-expense-form.component.scss']
})
export class OperationalExpenseFormComponent implements OnInit, OnDestroy {
  operationalExpenseForm: FormGroup;
  isEditMode: boolean = false;
  operationalExpenseId: string | null = null;
  loading: boolean = false;
  submitting: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private operationalExpenseService: OperationalExpenseService,
    private snackBar: MatSnackBar
  ) {
    this.operationalExpenseForm = this.fb.group({
      reason: ['', [Validators.required]],
      totalAmount: ['', [Validators.required, Validators.min(0)]],
      notes: [''],
      date: [new Date(), [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.operationalExpenseId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.operationalExpenseId;
    
    if (this.isEditMode && this.operationalExpenseId) {
      this.loadOperationalExpense(this.operationalExpenseId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOperationalExpense(id: string): void {
    this.loading = true;
    this.operationalExpenseService.getOperationalExpense(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (operationalExpense) => {
          this.operationalExpenseForm.patchValue({
            reason: operationalExpense.reason,
            totalAmount: operationalExpense.totalAmount,
            notes: operationalExpense.notes,
            date: new Date(operationalExpense.date)
          });
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al cargar el gasto operativo', 'Cerrar', { duration: 3000 });
          this.loading = false;
          this.router.navigate(['/operational-expenses']);
        }
      });
  }

  onSubmit(): void {
    if (this.operationalExpenseForm.invalid) {
      this.markFormGroupTouched(this.operationalExpenseForm);
      return;
    }

    this.submitting = true;
    const operationalExpenseData: OperationalExpense = {
      ...this.operationalExpenseForm.value,
      date: this.operationalExpenseForm.value.date.toISOString()
    };

    const action = this.isEditMode
      ? this.operationalExpenseService.updateOperationalExpense(this.operationalExpenseId!, operationalExpenseData)
      : this.operationalExpenseService.createOperationalExpense(operationalExpenseData);

    action.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const successMessage = this.isEditMode
            ? 'Gasto operativo actualizado con éxito'
            : 'Gasto operativo creado con éxito';
          
          Swal.fire({
            title: 'Éxito',
            text: successMessage,
            icon: 'success',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.router.navigate(['/operational-expenses']);
          });
        },
        error: (err) => {
          console.error(err);
          Swal.fire({
            title: 'Error',
            text: 'Error al guardar el gasto operativo',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          this.submitting = false;
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/operational-expenses']);
  }

  // Helper method to mark all controls in a form group as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
