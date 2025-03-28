/// <reference types="cypress" />

describe('Products Component', () => {
  beforeEach(() => {
    cy.loginAndVisitProducts();
  });

  it('should display the products list correctly', () => {
    // Check page title
    cy.get('.list-title').should('contain.text', 'Productos');

    // Check add product button
    cy.get('.list-header button').should('contain.text', 'Agregar Producto');

    // Check search field
    cy.get('.search-container input').should('have.attr', 'placeholder', 'Nombre, código de barras...');

    // Check table headers
    const headers = ['Nombre', 'Código de Barras', 'Precio', 'Stock', 'Acciones'];
    headers.forEach((header, index) => {
      // Skip the first column (image column) which has no header text
      cy.get('th').eq(index + 1).should('contain.text', header);
    });

    // Check product data in table
    cy.get('table tbody tr').should('have.length', 5);
    
    // Check first product data
    cy.get('table tbody tr').eq(0).within(() => {
      cy.get('td').eq(1).should('contain.text', 'Test Product 1');
      cy.get('td').eq(2).should('contain.text', 'TEST123');
      cy.get('td').eq(3).should('contain.text', '$19.99');
      cy.get('td').eq(4).should('contain.text', '50');
      cy.get('td').eq(5).find('button').should('have.length', 2); // Edit and delete buttons
    });
  });

  

  it('should navigate to product detail when clicking on a product', () => {
    // Spy on router navigation
    cy.window().then((win) => {
      cy.spy(win.history, 'pushState').as('navigate');
    });

    // Click on the first product
    cy.get('table tbody tr').eq(0).click();
    
    // Verify navigation to product detail page
    cy.get('@navigate').should('be.calledWith', 
      Cypress.sinon.match.any, 
      Cypress.sinon.match.any, 
      '/products/1'
    );
  });

  it('should navigate to edit product page when clicking edit button', () => {
    // Spy on router navigation
    cy.window().then((win) => {
      cy.spy(win.history, 'pushState').as('navigate');
    });

    // Click on the edit button of the first product
    cy.get('table tbody tr').eq(0).find('button').eq(0).click();
    
    // Verify navigation to edit product page
    cy.get('@navigate').should('be.calledWith', 
      Cypress.sinon.match.any, 
      Cypress.sinon.match.any, 
      '/products/edit/1'
    );
  });

  it('should show confirmation dialog when deleting a product', () => {
    // Mock the delete product API response
    cy.intercept('DELETE', '**/api/products/*', {
      statusCode: 200,
      body: { message: 'Product deleted successfully' }
    }).as('deleteProduct');

    // Click on the delete button of the first product
    cy.get('table tbody tr').eq(0).find('button').eq(1).click();
    
    // Verify SweetAlert appears
    cy.get('.swal2-popup').should('be.visible');
    cy.get('.swal2-title').should('contain.text', '¿Está seguro?');
    cy.get('.swal2-confirm').should('contain.text', 'Sí, eliminar');
    cy.get('.swal2-cancel').should('contain.text', 'Cancelar');
    
    // Confirm deletion
    cy.get('.swal2-confirm').click();
    
    // Verify API call
    cy.wait('@deleteProduct');
    
    // Verify success message
    cy.get('.swal2-popup').should('be.visible');
    cy.get('.swal2-title').should('contain.text', 'Eliminado');
  });

  it('should navigate to add product page when clicking add button', () => {
    // Spy on router navigation
    cy.window().then((win) => {
      cy.spy(win.history, 'pushState').as('navigate');
    });

    // Click on the add product button
    cy.get('.list-header button').click();
    
    // Verify navigation to add product page
    cy.get('@navigate').should('be.calledWith', 
      Cypress.sinon.match.any, 
      Cypress.sinon.match.any, 
      '/products/new'
    );
  });

  it('should handle pagination correctly', () => {
    // Mock the paginated products response
    cy.intercept('GET', '**/api/products?page=2*', {
      statusCode: 200,
      body: {
        products: [
          {
            _id: '4',
            name: 'Test Product 4',
            barcode: 'TEST101',
            salePrice: 49.99,
            purchaseCost: 25.00,
            quantity: 15,
            images: [],
            variants: []
          },
          {
            _id: '5',
            name: 'Test Product 5',
            barcode: 'TEST102',
            salePrice: 59.99,
            purchaseCost: 30.00,
            quantity: 20,
            images: [],
            variants: []
          }
        ],
        pagination: {
          total: 7,
          page: 2,
          limit: 2,
          pages: 2
        }
      }
    }).as('getNextPage');

    // Click on next page button
    cy.get('.mat-mdc-paginator-navigation-next').click();
    
    // Wait for API call
    cy.wait('@getNextPage');
    
    // Check that page 2 products are displayed
    cy.get('table tbody tr').should('have.length', 2);
    cy.get('table tbody tr').eq(0).should('contain.text', 'Test Product 4');
    cy.get('table tbody tr').eq(1).should('contain.text', 'Test Product 5');
  });

  it('should display no products message when there are no products', () => {
    // Mock empty products response
    cy.intercept('GET', '**/api/products*', {
      statusCode: 200,
      body: {
        products: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 5,
          pages: 0
        }
      }
    }).as('getEmptyProducts');

    // Reload the page to trigger the empty response
    cy.loginAndVisit('/products');
    cy.wait('@getEmptyProducts');
    
    // Check that no products message is displayed
    cy.get('.no-products').should('be.visible');
    cy.get('.no-products-text').should('contain.text', 'No hay productos disponibles');
    cy.get('.no-products button').should('contain.text', 'Agregar Producto');
  });

  it('should be responsive', () => {
    // Test medium screen size
    cy.viewport('ipad-2');
    cy.get('.product-list-container').should('be.visible');
    cy.get('.search-container').should('be.visible');
    
    // Test small screen size
    cy.viewport('iphone-6');
    cy.get('.product-list-container').should('be.visible');
    cy.get('.search-container').should('be.visible');
    cy.get('.table-container').should('have.css', 'overflow-x', 'auto');
  });


  it('should filter products when searching', () => {
    // Mock the filtered products response
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
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 5,
          pages: 1
        }
      }
    }).as('getFilteredProducts');

    // Type in search field
    cy.get('.search-container input').type('Test Product 1', { force: true });
    
    // Wait for debounce and API call
    cy.wait('@getFilteredProducts');
    
    // Check that only one product is displayed
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('table tbody tr').eq(0).should('contain.text', 'Test Product 1');
  });

});
