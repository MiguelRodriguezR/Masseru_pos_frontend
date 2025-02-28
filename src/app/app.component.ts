import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
    <app-header *ngIf="showHeader"></app-header>
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {
  showHeader = false;
  private excludedRoutes = ['/login', '/register', '/app-menu'];

  constructor(private router: Router) {}

  ngOnInit() {
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
}
