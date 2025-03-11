import { Injectable, OnDestroy } from '@angular/core';
import { EnvironmentService } from './environment.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable()
export class BaseService implements OnDestroy {
  protected baseUrl: string;
  protected destroy$ = new Subject<void>();

  constructor(protected environmentService: EnvironmentService) {
    this.baseUrl = this.environmentService.getBaseUrl();
    
    // Subscribe to environment changes
    this.environmentService.currentEnvironment$
      .pipe(takeUntil(this.destroy$))
      .subscribe(env => {
        this.baseUrl = env.baseUrl;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
