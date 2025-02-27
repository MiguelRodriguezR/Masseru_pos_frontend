import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User } from '../../users/user.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  baseUrl = environment.baseUrl;

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
  }

  getCurrentUser(): void {
    const token = this.authService.getToken();
    if (token) {
      this.http.get<User>(`${this.baseUrl}/api/users/me`).subscribe(
        (user) => {
          this.currentUser = user;
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
    if (this.currentUser && this.currentUser._id) {
      this.router.navigate(['/users', this.currentUser._id]);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
