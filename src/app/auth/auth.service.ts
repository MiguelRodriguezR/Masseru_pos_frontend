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

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
