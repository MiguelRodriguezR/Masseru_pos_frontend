import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EnvironmentConfig {
  baseUrl: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private availableEnvironments: EnvironmentConfig[] = [
    { baseUrl: 'http://100.73.149.127:3000', name: 'Remote' },
    { baseUrl: 'http://localhost:3000', name: 'Local' }
  ];

  private currentEnvironmentSubject = new BehaviorSubject<EnvironmentConfig>(
    this.availableEnvironments.find(env => env.baseUrl === environment.baseUrl) || this.availableEnvironments[0]
  );

  public currentEnvironment$ = this.currentEnvironmentSubject.asObservable();

  constructor() {
    // If we're in production mode, force the remote environment
    if (environment.production) {
      this.currentEnvironmentSubject.next(this.availableEnvironments[0]);
    }
  }

  getEnvironments(): EnvironmentConfig[] {
    return this.availableEnvironments;
  }

  getCurrentEnvironment(): EnvironmentConfig {
    return this.currentEnvironmentSubject.value;
  }

  setEnvironment(env: EnvironmentConfig): void {
    // Don't allow changing environment in production mode
    if (environment.production) {
      console.warn('Cannot change environment in production mode');
      return;
    }
    
    this.currentEnvironmentSubject.next(env);
  }

  getBaseUrl(): string {
    return this.currentEnvironmentSubject.value.baseUrl;
  }
}
