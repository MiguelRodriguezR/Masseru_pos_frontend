import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../user.service';
import { User } from '../user.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { UserDataService } from '../../shared/user-data.service';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit, OnDestroy {
  user?: User;
  userForm: FormGroup;
  loading = false;
  editMode = false;
  canApproveUser = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private userService: UserService, 
    private fb: FormBuilder,
    private userDataService: UserDataService
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      approved: [false]
    });
  }

  ngOnInit(): void {
    this.checkPermissions();
    this.loadUser();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  checkPermissions(): void {
    // Check user role for permissions
    const currentUser = this.userDataService.getCurrentUser();
    if (currentUser) {
      this.canApproveUser = currentUser.role === 'admin';
    }
  }
  
  loadUser(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if(id) {
      this.loading = true;
      this.userService.getUser(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.user = data;
            this.userForm.patchValue(data);
            this.loading = false;
          },
          error: (err) => {
            console.error(err);
            this.loading = false;
            Swal.fire({
              title: 'Error',
              text: 'No se pudo cargar la información del usuario',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
    }
  }

  onSubmit() {
    if(this.user && this.user._id && this.userForm.valid) {
      this.loading = true;
      this.userService.updateUser(this.user._id, this.userForm.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.editMode = false;
            // Update local user data
            this.user = { ...this.user, ...this.userForm.value };
            Swal.fire({
              title: 'Éxito',
              text: 'Usuario actualizado correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
          },
          error: (err) => {
            console.error(err);
            this.loading = false;
            Swal.fire({
              title: 'Error',
              text: 'No se pudo actualizar el usuario',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
    }
  }
  
  approveUser(): void {
    if (!this.user || !this.user._id) return;
    
    Swal.fire({
      title: '¿Aprobar usuario?',
      text: 'Esto permitirá que el usuario inicie sesión en el sistema',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.userService.approveUser(this.user!._id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.loading = false;
              // Update local user data
              this.user = { ...this.user!, approved: true };
              this.userForm.patchValue({ approved: true });
              
              Swal.fire(
                'Aprobado',
                'El usuario ha sido aprobado correctamente',
                'success'
              );
            },
            error: (err) => {
              console.error(err);
              this.loading = false;
              Swal.fire(
                'Error',
                'No se pudo aprobar el usuario',
                'error'
              );
            }
          });
      }
    });
  }
  
  deleteUser(): void {
    if (!this.user || !this.user._id) return;
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.user?._id) {
        this.loading = true;
        this.userService.deleteUser(this.user._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loading = false;
              Swal.fire(
                'Eliminado',
                'El usuario ha sido eliminado correctamente',
                'success'
              );
              this.router.navigate(['/users']);
            },
            error: (err) => {
              console.error(err);
              this.loading = false;
              Swal.fire(
                'Error',
                'No se pudo eliminar el usuario',
                'error'
              );
            }
          });
      }
    });
  }
  
  getRoleBadgeClass(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'admin';
      case 'employee':
      case 'seller':
        return 'employee';
      default:
        return 'user';
    }
  }
  
  getStatusBadgeClass(approved: boolean): string {
    return approved ? 'approved' : 'pending';
  }
}
