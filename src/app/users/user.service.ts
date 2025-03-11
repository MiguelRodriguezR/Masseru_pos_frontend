import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from './user.model';
import { Observable } from 'rxjs';
import { BaseService } from '../shared/base.service';
import { EnvironmentService } from '../shared/environment.service';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseService {
  constructor(
    private http: HttpClient,
    environmentService: EnvironmentService
  ) {
    super(environmentService);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/api/users`);
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/api/users/${id}`);
  }

  updateUser(id: string, user: Partial<User>): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/users/${id}`, user);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/users/${id}`);
  }
}
