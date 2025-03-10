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

  /**
   * Get all POS sessions
   * @returns Observable with all sessions data
   */
  getAllSessions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/pos-sessions`);
  }

  /**
   * Get a specific POS session by ID
   * @param sessionId Session ID
   * @returns Observable with session data
   */
  getSessionById(sessionId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/pos-sessions/${sessionId}`);
  }

  /**
   * Open a new POS session
   * @param initialCash Initial cash amount
   * @returns Observable with created session data
   */
  openSession(initialCash: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/pos-sessions/open`, { initialCash });
  }

  /**
   * Close a POS session
   * @param sessionId Session ID
   * @param actualCash Actual cash amount at closing
   * @param notes Optional notes about the session
   * @returns Observable with closed session data
   */
  closeSession(sessionId: string, actualCash: number, notes?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/pos-sessions/close`, {
      sessionId,
      actualCash,
      notes
    });
  }

  /**
   * Update a POS session
   * @param sessionId Session ID
   * @param data Data to update
   * @returns Observable with updated session data
   */
  updateSession(sessionId: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/pos-sessions/${sessionId}`, data);
  }
}
