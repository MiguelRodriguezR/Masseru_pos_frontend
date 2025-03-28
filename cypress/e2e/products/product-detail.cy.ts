/// <reference types="cypress" />

describe('Product Detail Component', () => {
  beforeEach(() => {
    // Use our custom command to visit a product detail page with mocked data
    cy.visitProductDetail('test-product-id', {
      name: 'Test Product',
      barcode: 'TEST123',
      salePrice: 29.99,
      purchaseCost: 15.00,
      quantity: 25,
      description: 'This is a detailed product description for testing purposes.',
      images: ['test-image.jpg'],
      variants: [
        { color: 'Red', size: 'M', quantity: 10 },
        { color: 'Blue', size: 'L', quantity: 15 }
      ]
    });

    // Mock the image URL
    cy.intercept('GET', '**/test-image.jpg', { fixture: 'example.json' }).as('getImage');
  });

  it('should display product details correctly', () => {
    // Check product name
    cy.get('.product-detail-container h1').should('contain.text', 'Test Product');
    
    // Check product barcode
    cy.get('.product-info').should('contain.text', 'TEST123');
    
    // Check product price
    cy.get('.product-info').should('contain.text', '$29.99');
    
    // Check product quantity
    cy.get('.product-info').should('contain.text', '25');
    
    // Check product description
    cy.get('.product-info').should('contain.text', 'This is a detailed product description');
  });

  it('should display product variants if available', () => {
    // Check variants section exists
    cy.get('.variants-section').should('exist');
    
    // Check variant items
    cy.get('.variants-table tbody tr').should('have.length', 2);
    
    // Check first variant details
    cy.get('.variants-table tbody tr').eq(0).should('contain.text', 'Red');
    cy.get('.variants-table tbody tr').eq(0).should('contain.text', 'M');
    cy.get('.variants-table tbody tr').eq(0).should('contain.text', '10');
    
    // Check second variant details
    cy.get('.variants-table tbody tr').eq(1).should('contain.text', 'Blue');
    cy.get('.variants-table tbody tr').eq(1).should('contain.text', 'L');
    cy.get('.variants-table tbody tr').eq(1).should('contain.text', '15');
  });

  it('should navigate to edit page when clicking edit button', () => {
    // Spy on router navigation
    cy.window().then((win) => {
      cy.spy(win.history, 'pushState').as('navigate');
    });

    // Click on edit button
    cy.get('button').contains('Editar').click();
    
    // Verify navigation to edit page
    cy.get('@navigate').should('be.calledWith', 
      Cypress.sinon.match.any, 
      Cypress.sinon.match.any, 
      '/products/edit/test-product-id'
    );
  });

  it('should navigate back to products list when clicking back button', () => {
    // Spy on router navigation
    cy.window().then((win) => {
      cy.spy(win.history, 'pushState').as('navigate');
    });

    // Click on back button
    cy.get('button').contains('Volver').click();
    
    // Verify navigation to products list
    cy.get('@navigate').should('be.calledWith', 
      Cypress.sinon.match.any, 
      Cypress.sinon.match.any, 
      '/products'
    );
  });

  it('should show confirmation dialog when deleting a product', () => {
    // Mock the delete product API response
    cy.intercept('DELETE', '**/api/products/*', {
      statusCode: 200,
      body: { message: 'Product deleted successfully' }
    }).as('deleteProduct');

    // Click on delete button
    cy.get('button').contains('Eliminar').click();
    
    // Verify SweetAlert appears
    cy.get('.swal2-popup').should('be.visible');
    cy.get('.swal2-title').should('contain.text', '¿Está seguro?');
    
    // Confirm deletion
    cy.get('.swal2-confirm').click();
    
    // Verify API call
    cy.wait('@deleteProduct');
    
    // Verify success message
    cy.get('.swal2-popup').should('be.visible');
    cy.get('.swal2-title').should('contain.text', 'Eliminado');
  });

  it('should be responsive', () => {
    // Test medium screen size
    cy.viewport('ipad-2');
    cy.get('.product-detail-container').should('be.visible');
    
    // Test small screen size
    cy.viewport('iphone-6');
    cy.get('.product-detail-container').should('be.visible');
  });
});
