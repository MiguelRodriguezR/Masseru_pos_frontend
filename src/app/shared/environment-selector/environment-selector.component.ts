import { Component, OnInit, OnDestroy } from '@angular/core';
import { EnvironmentService, EnvironmentConfig } from '../environment.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-environment-selector',
  templateUrl: './environment-selector.component.html',
  styleUrls: ['./environment-selector.component.scss']
})
export class EnvironmentSelectorComponent implements OnInit, OnDestroy {
  environments: EnvironmentConfig[] = [];
  selectedEnvironment: EnvironmentConfig | null = null;
  isProduction = environment.production;
  private destroy$ = new Subject<void>();

  constructor(private environmentService: EnvironmentService) {}

  ngOnInit(): void {
    // Load environments
    this.environments = this.environmentService.getEnvironments();
    
    // Subscribe to environment changes
    this.environmentService.currentEnvironment$
      .pipe(takeUntil(this.destroy$))
      .subscribe(env => {
        this.selectedEnvironment = env;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onEnvironmentChange(env: EnvironmentConfig): void {
    this.environmentService.setEnvironment(env);
  }
}
