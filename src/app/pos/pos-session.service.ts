import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PosSessionService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get open POS session for a user
   * @param userId User ID
   * @returns Observable with session data or error
   */
  getUserOpenSession(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/pos-sessions/user/${userId}/open`);
  }
}
