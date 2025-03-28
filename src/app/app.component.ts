import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CypressLogsService } from './shared/cypress-logs.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  template: `
    <app-header *ngIf="showHeader"></app-header>
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  showHeader = false;
  private excludedRoutes = ['/login', '/register', '/app-menu'];
  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private cypressLogsService: CypressLogsService,
    private ngZone: NgZone
  ) {
    // Expose a global function to check if logs should be enabled
    // This allows Cypress to trigger the service
    (window as any).cypressLogsServiceCheck = () => {
      this.ngZone.run(() => {
        this.cypressLogsService.checkIfEnabled();
      });
    };
  }

  ngOnInit() {
    // Initialize Cypress logs service (will auto-check if enabled)
    this.cypressLogsService.checkIfEnabled();
    
    // Subscribe to router events to determine when to show the header
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Check if the current route is in the excluded routes
      this.showHeader = !this.excludedRoutes.some(route => 
        event.urlAfterRedirects.startsWith(route)
      );
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    
    // Clean up global function
    delete (window as any).cypressLogsServiceCheck;
  }
}
