import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DOCUMENT } from '@angular/common';

export interface EnvironmentConfig {
  baseUrl: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private remoteEnvURL = 'http://masseru:3000'

  private availableEnvironments: EnvironmentConfig[] = [
    { baseUrl: this.remoteEnvURL , name: 'Remote' },
    { baseUrl: 'http://localhost:3000', name: 'Local' }
  ];

  private isLocalhost: boolean;
  private currentEnvironmentSubject: BehaviorSubject<EnvironmentConfig>;
  public currentEnvironment$: Observable<EnvironmentConfig>;

  constructor(@Inject(DOCUMENT) private document: Document) {
    // Check if we're running on localhost:4200
    this.isLocalhost = this.document.location.host === 'localhost:4200';
    
    // Initialize with the appropriate environment
    let initialEnv: EnvironmentConfig;
    
    if (this.isLocalhost) {
      // On localhost, use the environment from the config file
      initialEnv = this.availableEnvironments.find(env => env.baseUrl === environment.baseUrl) || this.availableEnvironments[0];
    } else {
      // On any other host, always use the remote environment
      initialEnv = this.availableEnvironments.find(env => env.baseUrl === this.remoteEnvURL) || this.availableEnvironments[0];
    }
    
    this.currentEnvironmentSubject = new BehaviorSubject<EnvironmentConfig>(initialEnv);
    this.currentEnvironment$ = this.currentEnvironmentSubject.asObservable();
  }

  getEnvironments(): EnvironmentConfig[] {
    return this.availableEnvironments;
  }

  getCurrentEnvironment(): EnvironmentConfig {
    return this.currentEnvironmentSubject.value;
  }

  setEnvironment(env: EnvironmentConfig): void {
    // Only allow changing environment on localhost:4200
    if (!this.isLocalhost) {
      console.warn('Cannot change environment when not running on localhost:4200');
      return;
    }
    
    this.currentEnvironmentSubject.next(env);
  }

  getBaseUrl(): string {
    return this.currentEnvironmentSubject.value.baseUrl;
  }
}
