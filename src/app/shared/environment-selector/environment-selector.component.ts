import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { EnvironmentService, EnvironmentConfig } from '../environment.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-environment-selector',
  templateUrl: './environment-selector.component.html',
  styleUrls: ['./environment-selector.component.scss']
})
export class EnvironmentSelectorComponent implements OnInit, OnDestroy {
  environments: EnvironmentConfig[] = [];
  selectedEnvironment: EnvironmentConfig | null = null;
  isProduction = environment.production;
  showSelector = false;
  private destroy$ = new Subject<void>();

  constructor(
    private environmentService: EnvironmentService,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {
    // Only show the selector when running on localhost:4200
    if (isPlatformBrowser(this.platformId)) {
      const hostname = this.document.location.host;
      this.showSelector = hostname === 'localhost:4200';
    } else {
      this.showSelector = false;
    }
  }

  ngOnInit(): void {
    // Only proceed with initialization if we're showing the selector
    if (this.showSelector) {
      // Load environments
      this.environments = this.environmentService.getEnvironments();
      
      // Subscribe to environment changes
      this.environmentService.currentEnvironment$
        .pipe(takeUntil(this.destroy$))
        .subscribe(env => {
          this.selectedEnvironment = env;
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onEnvironmentChange(env: EnvironmentConfig): void {
    this.environmentService.setEnvironment(env);
  }
}
