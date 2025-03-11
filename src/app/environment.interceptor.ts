import { Injectable, Inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentService } from './shared/environment.service';
import { environment } from '../environments/environment';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class EnvironmentInterceptor implements HttpInterceptor {
  private isLocalhost: boolean;

  constructor(
    private environmentService: EnvironmentService,
    @Inject(DOCUMENT) private document: Document
  ) {
    // Check if we're running on localhost:4200
    this.isLocalhost = this.document.location.host === 'localhost:4200';
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip if we're not on localhost - always use the production URL
    if (!this.isLocalhost) {
      return next.handle(req);
    }

    try {
      // Get the current baseUrl from the environment service
      const baseUrl = this.environmentService.getBaseUrl();
      
      // Check if the request URL starts with the environment baseUrl
      // This is to avoid modifying URLs that are not API calls (e.g., external services)
      if (req.url.startsWith(environment.baseUrl)) {
        // Replace the baseUrl in the request URL with the current baseUrl from the environment service
        const updatedUrl = req.url.replace(environment.baseUrl, baseUrl);
        const cloned = req.clone({
          url: updatedUrl
        });
        return next.handle(cloned);
      }
    } catch (error) {
      console.error('Error in environment interceptor:', error);
      // If there's any error in the interceptor, just pass the request through
    }
    
    return next.handle(req);
  }
}
