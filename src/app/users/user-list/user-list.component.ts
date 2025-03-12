import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { UserService } from '../user.service';
import { User } from '../user.model';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { UserDataService } from '../../shared/user-data.service';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  loading = false;
  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'actions'];
  
  // Pagination
  totalUsers = 0;
  totalPages = 1;
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  
  // Permissions
  canCreateUser = false;
  canEditUser = false;
  canDeleteUser = false;
  canApproveUser = false;
  
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('paginator') paginator!: MatPaginator;
  
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService, 
    private router: Router,
    private userDataService: UserDataService
  ) {}

  ngOnInit(): void {
    this.checkPermissions();
    this.loadUsers();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  checkPermissions(): void {
    // Check user role for permissions
    const currentUser = this.userDataService.getCurrentUser();
    if (currentUser) {
      const isAdmin = currentUser.role === 'admin';
      this.canCreateUser = false; // Removed "Add User" button as per requirements
      this.canEditUser = isAdmin;
      this.canDeleteUser = isAdmin;
      this.canApproveUser = isAdmin;
    }
  }

  loadUsers(page: number = 1, limit: number = 10): void {
    this.currentPage = page;
    this.pageSize = limit;
    this.loading = true;
    
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.users = data;
          this.filteredUsers = [...this.users];
          this.totalUsers = this.users.length;
          this.totalPages = Math.ceil(this.totalUsers / this.pageSize);
          
          // Apply search filter if there's a search term
          if (this.searchTerm) {
            this.applyFilter({ target: { value: this.searchTerm } } as any);
          }
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los usuarios',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTerm = filterValue;
    
    if (filterValue) {
      this.filteredUsers = this.users.filter(user => 
        user.name.toLowerCase().includes(filterValue) || 
        user.email.toLowerCase().includes(filterValue) ||
        user.role.toLowerCase().includes(filterValue)
      );
    } else {
      this.filteredUsers = [...this.users];
    }
    
    // Reset to first page when filtering
    this.currentPage = 1;
  }

  viewUser(id: string): void {
    this.router.navigate(['/users', id]);
  }
  
  editUser(id: string): void {
    this.router.navigate(['/users/edit', id]);
  }
  
  approveUser(id: string, event: Event): void {
    event.stopPropagation();
    
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
        this.userService.approveUser(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire(
                'Aprobado',
                'El usuario ha sido aprobado correctamente',
                'success'
              );
              this.loadUsers(this.currentPage, this.pageSize);
            },
            error: (err) => {
              console.error(err);
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
  
  deleteUser(id: string, event: Event): void {
    event.stopPropagation();
    
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
      if (result.isConfirmed) {
        this.userService.deleteUser(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire(
                'Eliminado',
                'El usuario ha sido eliminado correctamente',
                'success'
              );
              this.loadUsers(this.currentPage, this.pageSize);
            },
            error: (err) => {
              console.error(err);
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
