/// <reference types="cypress" />

// ***********************************************
// Custom commands for MasseruPOS testing
// ***********************************************

/**
 * Custom command to enable console logs display in the DOM
 * This makes application console logs visible in screenshots and videos
 */
Cypress.Commands.add('enableConsoleLogs', () => {
  // Set the flag before the page loads
  cy.on('window:before:load', (win) => {
    win.localStorage.setItem('cypress_show_logs', 'true');
  });
  
  // Also set it on the current window if already loaded
  cy.window().then((win) => {
    win.localStorage.setItem('cypress_show_logs', 'true');
    
    // If the CypressLogsService is already initialized, trigger a check
    if (win.document.getElementById('cypress-logs') === null) {
      // Inject a script to trigger the service
      const script = win.document.createElement('script');
      script.textContent = `
        if (window.cypressLogsServiceCheck) {
          window.cypressLogsServiceCheck();
        }
      `;
      win.document.head.appendChild(script);
    }
  });
});

/**
 * Custom command to disable console logs display in the DOM
 */
Cypress.Commands.add('disableConsoleLogs', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('cypress_show_logs');
  });
});

/**
 * Custom command to bypass authentication and visit a protected route
 * This prevents redirects to login and handles API requests
 */
Cypress.Commands.add('loginAndVisit', (route) => {
  // Solo intercepta redirecciones al login
  cy.intercept('GET', '**/login*', (req) => {
    req.reply(200, {});
  }).as('loginRedirect');
  
  // Visita la ruta con el token de autenticación
  cy.visit(route, {
    onBeforeLoad: (win) => {
      // Establece el token de autenticación
      win.localStorage.setItem('token', 'fake-jwt-token');
      
      // Evita redirecciones a /login
      const originalPushState = win.history.pushState;
      win.history.pushState = function(state, title, url) {
        if (url && url.toString().includes('/login')) {
          return;
        }
        return originalPushState.call(this, state, title, url);
      };
    }
  });
  
  // Espera a que la página se estabilice
  cy.wait(100);
});

/**
 * Custom command to visit public routes (login, register)
 * without authentication requirements
 */
Cypress.Commands.add('visitPublicRoute', (route) => {
  // Intercept API requests
  cy.intercept('GET', '**/api/**', { statusCode: 200, body: {} }).as('apiRequests');
  
  // Visit without authentication
  cy.visit(route);
  
  // Wait for page to stabilize
  cy.wait(50);
});

/**
 * Custom command to visit a product detail page with mocked data
 * This handles authentication and API mocking
 */
Cypress.Commands.add('visitProductDetail', (productId: string, productData: any = {}) => {
  // Default product data
  const defaultProduct = {
    _id: productId,
    name: 'Test Product',
    barcode: 'TEST123',
    salePrice: 19.99,
    purchaseCost: 10.00,
    quantity: 50,
    description: 'This is a test product description',
    images: [],
    variants: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Merge default with provided data
  const product = { ...defaultProduct, ...productData };
  
  // Intercept product detail API request
  cy.intercept('GET', `**/api/products/${productId}`, {
    statusCode: 200,
    body: product
  }).as('getProductDetail');
  
  // Visit product detail page with authentication
  cy.loginAndVisit(`/products/${productId}`);
  
  // Wait for API request to complete
  cy.wait('@getProductDetail');
  
  // Wait for loading spinner to disappear
  // cy.get('.loading-overlay').should('not.exist', { timeout: 500 });
});


Cypress.Commands.add('loginAndVisitProducts', () => {
  // Define el intercept antes de cargar la aplicación
  cy.intercept('GET', '**/api/products*', {
    statusCode: 200,
    body: {
      products: [
        {
          _id: '1',
          name: 'Test Product 1',
          barcode: 'TEST123',
          salePrice: 19.99,
          purchaseCost: 10.00,
          quantity: 50,
          images: [],
          variants: []
        },
        {
          _id: '2',
          name: 'Test Product 2',
          barcode: 'TEST456',
          salePrice: 29.99,
          purchaseCost: 15.00,
          quantity: 25,
          images: [],
          variants: []
        },
        {
          _id: '3',
          name: 'Test Product 3',
          barcode: 'TEST789',
          salePrice: 39.99,
          purchaseCost: 20.00,
          quantity: 10,
          images: [],
          variants: []
        },
        {
          _id: '4',
          name: 'Test Product 4',
          barcode: 'TEST789',
          salePrice: 39.99,
          purchaseCost: 20.00,
          quantity: 10,
          images: [],
          variants: []
        },
        {
          _id: '5',
          name: 'Test Product 5',
          barcode: 'TEST789',
          salePrice: 39.99,
          purchaseCost: 20.00,
          quantity: 10,
          images: [],
          variants: []
        }
      ],
      pagination: {
        total: 7,
        page: 1,
        limit: 5,
        pages: 2
      }
    }
  }).as('getProducts');

  cy.loginAndVisit('/products');

  // Espera a que se intercepte la petición
  cy.wait('@getProducts', { timeout: 30000 });
});

// Add to Cypress types
declare namespace Cypress {
  interface Chainable {
    /**
     * Enable console logs display in the DOM
     * This is useful for debugging and seeing logs in screenshots/videos
     */
    enableConsoleLogs(): Chainable<any>
    
    /**
     * Disable console logs display in the DOM
     */
    disableConsoleLogs(): Chainable<any>

    /**
     * Login and visit a protected route
     * @param route - The route to visit
     */
    loginAndVisit(route: string): Chainable<any>

    /**
     * Visit a public route without authentication
     * @param route - The route to visit
     */
    visitPublicRoute(route: string): Chainable<any>
    
    /**
     * Visit a product detail page with mocked data
     * @param productId - The product ID to visit
     * @param productData - Optional product data to override defaults
     */
    visitProductDetail(productId: string, productData?: any): Chainable<any>

    /**
     * Visit a product list page with mocked data
     */
    loginAndVisitProducts(): Chainable<any>
  }
}
