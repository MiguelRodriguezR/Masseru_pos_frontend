/// <reference types="cypress" />

describe('Product Form Component', () => {
  context('Create New Product', () => {
    beforeEach(() => {
      // Visit the new product form
      cy.loginAndVisit('/products/new');
      
      // Mock API requests
      cy.intercept('POST', '**/api/products', {
        statusCode: 200,
        body: { 
          _id: 'new-product-id',
          message: 'Product created successfully' 
        }
      }).as('createProduct');
      
      // Wait for the form to load
      cy.get('form').should('be.visible');
      cy.get('.loading-overlay').should('not.exist');
    });

    it('should display the new product form correctly', () => {
      // Check form title
      cy.get('h2').should('contain.text', 'Crear Producto');
      
      // Check form fields
      cy.get('input[formControlName="name"]').should('be.visible');
      cy.get('input[formControlName="barcode"]').should('be.visible');
      cy.get('input[formControlName="salePrice"]').should('be.visible');
      cy.get('input[formControlName="purchaseCost"]').should('be.visible');
      cy.get('input[formControlName="quantity"]').should('be.visible');
      cy.get('textarea[formControlName="description"]').should('be.visible');
      
      // Check buttons
      cy.get('button').contains('Crear').should('be.visible');
      cy.get('button').contains('Cancelar').should('be.visible');
    });

    it('should validate form inputs', () => {
      // Test required fields
      cy.get('input[formControlName="name"]').focus().blur();
      cy.get('input[formControlName="barcode"]').focus().blur();
      cy.get('input[formControlName="salePrice"]').focus().blur();
      
      // Check error messages
      cy.get('mat-error').should('be.visible');
      
      // Fill required fields
      cy.get('input[formControlName="name"]').type('Test Product');
      cy.get('input[formControlName="barcode"]').type('TEST123');
      cy.get('input[formControlName="salePrice"]').type('19.99');
      cy.get('input[formControlName="purchaseCost"]').type('10.00');
      cy.get('input[formControlName="quantity"]').type('50');
      
      // Check that save button is enabled
      cy.get('button').contains('Crear').should('not.be.disabled');
    });

    it('should submit the form and create a new product', function() {
      // Fill form
      cy.get('input[formControlName="name"]').type('Test Product');
      cy.get('input[formControlName="barcode"]').type('TEST123');
      cy.get('input[formControlName="salePrice"]').type('19.99');
      cy.get('input[formControlName="purchaseCost"]').type('10.00');
      cy.get('input[formControlName="quantity"]').type('50');
      cy.get('textarea[formControlName="description"]').type('This is a test product description');
      
      // Submit form
      cy.get('button').contains('Crear').click();
      
      // Check loading state
      cy.get('.loading-overlay').should('be.visible');
      
      // Wait for API call
      cy.wait('@createProduct');

      if (!Cypress.browser.isHeadless) {
        cy.get('.mat-mdc-snack-bar-label').should('be.visible').and('contain.text', 'xito');
      }
      
    });

    it('should navigate back to products list when clicking cancel', () => {
      // Spy on router navigation
      cy.window().then((win) => {
        cy.spy(win.history, 'pushState').as('navigate');
      });
      
      // Click cancel button
      cy.get('button').contains('Cancelar').click();
      
      // Verify navigation to products list
      cy.get('@navigate').should('be.calledWith', 
        Cypress.sinon.match.any, 
        Cypress.sinon.match.any, 
        '/products'
      );
    });
  });

  context('Edit Existing Product', () => {
    beforeEach(() => {
      // Mock the product data
      cy.intercept('GET', '**/api/products/edit-product-id', {
        statusCode: 200,
        body: {
          _id: 'edit-product-id',
          name: 'Existing Product',
          barcode: 'EXIST123',
          salePrice: 29.99,
          purchaseCost: 15.00,
          quantity: 25,
          description: 'This is an existing product',
          images: [],
          variants: []
        }
      }).as('getProduct');
      
      // Mock update API
      cy.intercept('PUT', '**/api/products/edit-product-id', {
        statusCode: 200,
        body: { 
          message: 'Product updated successfully' 
        }
      }).as('updateProduct');
      
      // Visit edit form
      cy.loginAndVisit('/products/edit/edit-product-id');
      
      // Wait for product data to load
      cy.wait('@getProduct');
      cy.get('.loading-overlay').should('not.exist');
    });

    it('should load existing product data into the form', () => {
      // Check form title
      cy.get('h2').should('contain.text', 'Editar Producto');
      
      // Check form fields are populated
      cy.get('input[formControlName="name"]').should('have.value', 'Existing Product');
      cy.get('input[formControlName="barcode"]').should('have.value', 'EXIST123');
      cy.get('input[formControlName="salePrice"]').should('have.value', '29.99');
      cy.get('input[formControlName="purchaseCost"]').should('have.value', '15');
      cy.get('input[formControlName="quantity"]').should('have.value', '25');
      cy.get('textarea[formControlName="description"]').should('have.value', 'This is an existing product');
    });

    it('should update an existing product', function() {
      // Modify form data
      cy.get('input[formControlName="name"]').clear().type('Updated Product');
      cy.get('input[formControlName="salePrice"]').clear().type('39.99');
      
      // Submit form
      cy.get('button').contains('Actualizar').click();
      
      // Check loading state
      cy.get('.loading-overlay').should('be.visible');
      
      // Wait for API call
      cy.wait('@updateProduct');


      if (!Cypress.browser.isHeadless) {
        cy.get('.mat-mdc-snack-bar-label').should('be.visible').and('contain.text', 'tualizado');
      }
    });
  });

  it('should be responsive', () => {
    // Visit the new product form
    cy.loginAndVisit('/products/new');
    
    // Test medium screen size
    cy.viewport('ipad-2');
    cy.get('form').should('be.visible');
    
    // Test small screen size
    cy.viewport('iphone-6');
    cy.get('form').should('be.visible');
    cy.get('mat-form-field').should('have.css', 'width', '150px');
  });
});
