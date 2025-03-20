/// <reference types="cypress" />

// ***********************************************
// Custom commands for MasseruPOS testing
// ***********************************************

/**
 * Custom command to bypass authentication and visit a protected route
 * This prevents redirects to login and handles API requests
 */
Cypress.Commands.add('loginAndVisit', (route) => {
  // Intercept API requests
  cy.intercept('GET', '**/api/**', { statusCode: 200, body: {} }).as('apiRequests');
  
  // Block redirects to login page
  cy.intercept('GET', '**/login*', (req) => {
    req.reply(200, {});
  }).as('loginRedirect');
  
  // Visit with authentication token
  cy.visit(route, {
    onBeforeLoad: (win) => {
      // Set auth token
      win.localStorage.setItem('token', 'fake-jwt-token');
      
      // Prevent redirects to login
      const originalPushState = win.history.pushState;
      win.history.pushState = function(state, title, url) {
        if (url && url.toString().includes('/login')) {
          return;
        }
        return originalPushState.call(this, state, title, url);
      };
    }
  });
  
  // Wait for page to stabilize
  cy.wait(100);
});

// Add to Cypress types
declare namespace Cypress {
  interface Chainable {
    /**
     * Login and visit a protected route
     * @param route - The route to visit
     */
    loginAndVisit(route: string): Chainable<any>
  }
}
