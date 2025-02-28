import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../users/user.model';
import { UserDataService } from '../user-data.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private userDataService: UserDataService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    
    // Subscribe to user data changes
    this.userDataService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserData(): void {
    const userData = this.userDataService.loadUserData();
    if (userData) {
      userData.pipe(takeUntil(this.destroy$)).subscribe(
        (user) => {
          // User data is already set via the subscription to currentUser$
        },
        (error) => {
          console.error('Error fetching current user:', error);
        }
      );
    }
  }

  goToAppMenu(): void {
    this.router.navigate(['/app-menu']);
  }

  editProfile(): void {
    const userId = this.userDataService.getUserId();
    if (userId) {
      this.router.navigate(['/users', userId]);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
