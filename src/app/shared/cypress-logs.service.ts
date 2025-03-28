import { Injectable, Renderer2, RendererFactory2, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CypressLogsService implements OnDestroy {
  private renderer: Renderer2;
  private logsContainer: HTMLElement | null = null;
  private originalConsole: any = {};
  private isEnabled = false;
  private readonly CYPRESS_LOGS_FLAG = 'cypress_show_logs';
  private isBrowser: boolean;
  
  // Observable to track enabled state
  private enabledSubject = new BehaviorSubject<boolean>(false);
  public enabled$: Observable<boolean> = this.enabledSubject.asObservable();

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Only initialize in browser environment
    if (this.isBrowser) {
      this.checkIfEnabled();
    }
  }

  /**
   * Check if the feature is enabled via localStorage
   */
  public checkIfEnabled(): void {
    if (!this.isBrowser) return;
    
    try {
      const enabled = localStorage.getItem(this.CYPRESS_LOGS_FLAG) === 'true';
      // Also check if we're running in Cypress
      const isCypress = (window as any).Cypress !== undefined;
      
      if ((enabled || isCypress) && !this.isEnabled) {
        this.enable();
      } else if (!enabled && !isCypress && this.isEnabled) {
        this.disable();
      }
    } catch (e) {
      console.error('Error checking if cypress logs are enabled:', e);
    }
  }

  /**
   * Enable console log interception and display
   */
  public enable(): void {
    if (this.isEnabled || !this.isBrowser) return;
    
    this.isEnabled = true;
    try {
      localStorage.setItem(this.CYPRESS_LOGS_FLAG, 'true');
    } catch (e) {
      console.error('Error setting cypress logs flag in localStorage:', e);
    }
    
    this.enabledSubject.next(true);
    
    // Create logs container if it doesn't exist
    if (!this.logsContainer) {
      this.createLogsContainer();
    }
    
    // Save original console methods
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
    
    // Override console methods
    console.log = this.createOverride('log');
    console.info = this.createOverride('info');
    console.warn = this.createOverride('warn');
    console.error = this.createOverride('error');
    console.debug = this.createOverride('debug');
  }

  /**
   * Disable console log interception and display
   */
  public disable(): void {
    if (!this.isEnabled || !this.isBrowser) return;
    
    this.isEnabled = false;
    try {
      localStorage.removeItem(this.CYPRESS_LOGS_FLAG);
    } catch (e) {
      console.error('Error removing cypress logs flag from localStorage:', e);
    }
    
    this.enabledSubject.next(false);
    
    // Restore original console methods
    if (this.originalConsole.log) {
      console.log = this.originalConsole.log;
      console.info = this.originalConsole.info;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;
      console.debug = this.originalConsole.debug;
    }
    
    // Remove logs container
    this.removeLogsContainer();
  }

  /**
   * Create the logs container in the DOM
   */
  private createLogsContainer(): void {
    if (!this.isBrowser || typeof document === 'undefined') return;
    
    try {
      this.logsContainer = document.createElement('div');
      this.logsContainer.id = 'cypress-logs';
      this.logsContainer.style.position = 'fixed';
      this.logsContainer.style.bottom = '0';
      this.logsContainer.style.left = '0';
      this.logsContainer.style.background = 'rgba(0,0,0,0.8)';
      this.logsContainer.style.color = '#fff';
      this.logsContainer.style.fontSize = '12px';
      this.logsContainer.style.maxHeight = '400px';
      this.logsContainer.style.width = '100%';
      this.logsContainer.style.overflowY = 'auto';
      this.logsContainer.style.zIndex = '9999';
      this.logsContainer.style.padding = '8px';
      this.logsContainer.style.fontFamily = 'monospace';
      this.logsContainer.style.pointerEvents = 'none';
      
      document.body.appendChild(this.logsContainer);
    } catch (e) {
      console.error('Error creating logs container:', e);
    }
  }

  /**
   * Remove the logs container from the DOM
   */
  private removeLogsContainer(): void {
    if (this.logsContainer && document.body.contains(this.logsContainer)) {
      document.body.removeChild(this.logsContainer);
      this.logsContainer = null;
    }
  }

  /**
   * Create an override for a console method
   */
  private createOverride(type: string): (...args: any[]) => void {
    const originalFn = this.originalConsole[type];
    const self = this;
    
    return function(...args: any[]): void {
      // Call original console method
      originalFn.apply(console, args);
      
      // Add to DOM if enabled
      if (self.isEnabled && self.logsContainer) {
        const logEntry = document.createElement('div');
        logEntry.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
        logEntry.style.padding = '4px 0';
        
        // Style based on log type
        switch (type) {
          case 'error':
            logEntry.style.color = '#ff5252';
            break;
          case 'warn':
            logEntry.style.color = '#ffab40';
            break;
          case 'info':
            logEntry.style.color = '#40c4ff';
            break;
          case 'debug':
            logEntry.style.color = '#b388ff';
            break;
          default:
            logEntry.style.color = '#ffffff';
        }
        
        // Format timestamp
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = document.createElement('span');
        prefix.textContent = `[${timestamp}] [${type.toUpperCase()}] `;
        prefix.style.fontWeight = 'bold';
        logEntry.appendChild(prefix);
        
        // Format arguments
        args.forEach((arg, index) => {
          let content: string;
          
          if (arg === null) {
            content = 'null';
          } else if (arg === undefined) {
            content = 'undefined';
          } else if (typeof arg === 'object') {
            try {
              content = JSON.stringify(arg, null, 2);
            } catch (e) {
              content = arg.toString();
            }
          } else {
            content = String(arg);
          }
          
          const argSpan = document.createElement('span');
          argSpan.textContent = content;
          
          if (index > 0) {
            logEntry.appendChild(document.createTextNode(' '));
          }
          
          logEntry.appendChild(argSpan);
        });
        
        // Add to container and scroll to bottom
        self.logsContainer.appendChild(logEntry);
        self.logsContainer.scrollTop = self.logsContainer.scrollHeight;
        
        // Limit number of entries to prevent memory issues
        while (self.logsContainer.children.length > 1000) {
          self.logsContainer.removeChild(self.logsContainer.firstChild as Node);
        }
      }
    };
  }

  /**
   * Clear all logs from the container
   */
  public clearLogs(): void {
    if (this.logsContainer) {
      while (this.logsContainer.firstChild) {
        this.logsContainer.removeChild(this.logsContainer.firstChild);
      }
    }
  }

  ngOnDestroy(): void {
    // Restore original console methods
    this.disable();
  }
}
