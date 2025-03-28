// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import "cypress-real-events";

// Enable console logs display in the DOM for all tests
// This will make application console logs visible in screenshots and videos
beforeEach(() => {
  // Enable console logs display
  cy.enableConsoleLogs();
});

// Add a custom command to Cypress to log test information
Cypress.Commands.overwrite('log', (originalFn, ...args) => {
  // Call the original log function
  originalFn(...args);
  
  // Also log to the application console so it appears in the DOM
  cy.window().then(win => {
    win.console.log(`[CYPRESS] ${args.join(' ')}`);
  });
});

// Log when tests start and end
before(() => {
  cy.window().then(win => {
    win.console.log('Cypress test suite started');
  });
});

after(() => {
  cy.window().then(win => {
    win.console.log('Cypress test suite completed');
  });
});
