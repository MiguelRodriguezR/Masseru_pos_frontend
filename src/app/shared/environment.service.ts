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
  private masseruServerURL = 'http://100.73.149.127:3000'

  private availableEnvironments: EnvironmentConfig[] = [
    { baseUrl: this.masseruServerURL, name: 'Remote' },
    { baseUrl: 'http://localhost:3000', name: 'Local' }
  ];

  private currentEnvironmentSubject = new BehaviorSubject<EnvironmentConfig>(
    this.availableEnvironments.find(env => env.baseUrl === environment.baseUrl) || this.availableEnvironments[0]
  );

  public currentEnvironment$ = this.currentEnvironmentSubject.asObservable();

  constructor() {
    // If we're in production mode, force the remote environment and don't allow changes
    if (environment.production) {
      // Make sure we're using the remote environment in production
      const remoteEnv = this.availableEnvironments.find(env => env.baseUrl === this.masseruServerURL);
      if (remoteEnv) {
        this.currentEnvironmentSubject.next(remoteEnv);
      } else {
        this.currentEnvironmentSubject.next(this.availableEnvironments[0]);
      }
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
    
    // Only update if we're in development mode
    if (!environment.production) {
      this.currentEnvironmentSubject.next(env);
    }
  }

  getBaseUrl(): string {
    return this.currentEnvironmentSubject.value.baseUrl;
  }
}
