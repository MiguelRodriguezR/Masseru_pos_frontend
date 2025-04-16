import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseService } from '../shared/base.service';
import { EnvironmentService } from '../shared/environment.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {
  private userDataService: any; // Will be set by setUserDataService to avoid circular dependency

  constructor(
    private http: HttpClient,
    environmentService: EnvironmentService
  ) {
    super(environmentService);
  }

  // Method to set UserDataService to avoid circular dependency
  setUserDataService(userDataService: any): void {
    this.userDataService = userDataService;
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/login`, { email, password });
  }

  register(name: string, email: string, password: string, role: string = 'seller'): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/register`, { name, email, password, role });
  }

  logout() {
    localStorage.removeItem('token');
    // Clear user data if userDataService is available
    if (this.userDataService) {
      this.userDataService.clearUserData();
    }
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const decodedToken = this.decodeToken(token);
    if (!decodedToken || !decodedToken.exp) {
      this.logout();
      return false;
    }

    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    const isExpired = decodedToken.exp * 1000 < Date.now();
    if (isExpired) {
      this.logout();
      return false;
    }

    return true;
  }
}
