import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../users/user.model';
import { UserService } from '../users/user.service';
import { AuthService } from '../auth/auth.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private userId: string | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {
    // Set this service in AuthService to avoid circular dependency
    this.authService.setUserDataService(this);
  }

  /**
   * Decode JWT token to extract user ID
   */
  private decodeToken(token: string): any {
    try {
      // JWT tokens are split into three parts: header, payload, signature
      // We need the payload (second part)
      const payload = token.split('.')[1];
      // Base64 decode and parse as JSON
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Load user data from token and API
   */
  loadUserData(): Observable<User | null> | null {
    const token = this.authService.getToken();
    
    if (!token) {
      return null;
    }

    const decodedToken = this.decodeToken(token);
    
    if (!decodedToken || !decodedToken.id) {
      console.error('Invalid token or missing user ID');
      return null;
    }

    this.userId = decodedToken.id;
    
    // If we already have the user data, return it
    if (this.currentUserSubject.value) {
      return this.currentUser$;
    }

    // Otherwise, fetch it from the API
    if (this.userId) {
      return this.userService.getUser(this.userId).pipe(
        tap(user => {
          this.currentUserSubject.next(user);
        })
      );
    }
    
    return null;
  }

  /**
   * Get current user data
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get user ID from token
   */
  getUserId(): string | null {
    if (this.userId) {
      return this.userId;
    }

    const token = this.authService.getToken();
    if (!token) {
      return null;
    }

    const decodedToken = this.decodeToken(token);
    if (!decodedToken || !decodedToken.id) {
      return null;
    }

    this.userId = decodedToken.id;
    return this.userId;
  }

  /**
   * Clear user data on logout
   */
  clearUserData(): void {
    this.currentUserSubject.next(null);
    this.userId = null;
  }
}
