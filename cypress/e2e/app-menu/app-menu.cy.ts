// This is an E2E test for the app-menu component
// To run this test, use the command: npx cypress run
// Or use: npm run cy:open

describe('App Menu', () => {
  beforeEach(() => {
    // Use our custom command to login and visit the dashboard
    // This handles authentication and prevents redirects
    cy.loginAndVisit('/app-menu');

    cy.intercept('GET', '**/api/*', {
      statusCode: 200,}
    ).as('getProducts');
  });

  it('should display the app menu title with logo', () => {
    cy.get('.app-menu-title img')
      .should('be.visible')
      .and('have.attr', 'src', 'assets/title.png')
      .and('have.attr', 'alt', 'Descripción de la imagen')
      .and('have.css', 'width', '250px');
  });

  it('should display all menu items', () => {
    // Check that all menu items are displayed
    cy.get('.menu-item').should('have.length', 9); // 8 menu items + logout

    // Check specific menu items
    const menuItems = [
      { name: 'Dashboard', icon: 'dashboard' },
      { name: 'POS', icon: 'point_of_sale' },
      { name: 'Productos', icon: 'inventory_2' },
      { name: 'Compras', icon: 'shopping_cart' },
      { name: 'Recibos', icon: 'receipt' },
      { name: 'Ventas', icon: 'trending_up' },
      { name: 'Métodos de Pago', icon: 'payments' },
      { name: 'Usuarios', icon: 'people' },
      { name: 'Cerrar Session', icon: 'logout' }
    ];

    menuItems.forEach((item, index) => {
      cy.get('.menu-item').eq(index).within(() => {
        cy.get('.menu-item-name').should('contain.text', item.name);
        cy.get('mat-icon').should('contain.text', item.icon);
      });
    });
  });

  it('should navigate to the correct route when clicking a menu item', () => {
    // Configuramos el spy en el primer window
    cy.window().then((win) => {
      cy.spy(win.history, 'pushState').as('navigate');
    });
  
    // Click en el menú Dashboard y verificamos la navegación
    cy.get('.menu-item').eq(0).click();
    cy.get('@navigate').should('be.calledWith', 
      Cypress.sinon.match.any, 
      Cypress.sinon.match.any, 
      '/dashboard'
    );
  
    // Navegamos a /app-menu y volvemos a configurar el spy en la nueva instancia de window
    cy.loginAndVisit('/app-menu').then(() => {
      cy.window().then((win) => {
        cy.spy(win.history, 'pushState').as('navigate2');
      });
    });
  
    // Click en el menú POS y verificamos la navegación
    cy.get('.menu-item').eq(1).click();
    cy.get('@navigate2').should('be.calledWith', 
      Cypress.sinon.match.any, 
      Cypress.sinon.match.any, 
      '/pos'
    );
  });
  


  it('should call logout and navigate to login when clicking logout button', () => {
    // Intercept the logout API call
    // cy.intercept('POST', '**/logout', { statusCode: 200 }).as('logout');
    
    // Intercept navigation to verify it's called with the correct route
    cy.window().then((win) => {
      cy.spy(win.history, 'pushState').as('navigate');
    });

    // Click on logout menu item (last item)
    cy.get('.menu-item').last().click();
    
    // Verify logout was called
    // cy.wait('@logout');
    
    // Verify navigation to login page
    cy.get('@navigate').should('be.calledWith', 
      Cypress.sinon.match.any, 
      Cypress.sinon.match.any, 
      '/login'
    );
  });

  it('should apply hover effects on menu items', () => {
    // Check hover effect on a menu item
    cy.get('.menu-item').first().realHover();

    cy.get('.menu-item').first()
      .should('have.css', 'transform', 'matrix(1, 0, 0, 1, 0, -5)'); // translateY(-5px)
    
    // Check hover effect on icon container
    cy.get('.menu-item').first().find('.menu-icon-container')
      .should('have.css', 'background-color')
      .and('not.equal', 'rgb(255, 255, 255)'); // Not white anymore
    
    // Check icon color change on hover
    cy.get('.menu-item').first().find('mat-icon')
      .should('have.css', 'color', 'rgb(255, 255, 255)'); // White color
  });

  it('should be responsive', () => {
    // Test medium screen size
    cy.viewport('ipad-2');
    cy.get('.app-menu-grid').should('have.css', 'grid-template-columns', '184px 184px 184px');
    cy.get('.menu-icon-container').first().should('have.css', 'width', '70px');
    cy.get('.menu-icon-container').first().should('have.css', 'height', '70px');
    
    // Test small screen size
    cy.viewport('iphone-6');
    cy.get('.app-menu-container').should('have.css', 'padding', '16px'); // $spacing-md
    cy.get('.app-menu-title').should('have.css', 'font-size', '24px'); // $font-size-xl
    cy.get('.menu-icon-container').first().should('have.css', 'width', '90px');
    cy.get('.menu-icon-container').first().should('have.css', 'height', '90px');
    cy.get('.menu-item-name').first().should('have.css', 'font-size', '12px'); // $font-size-xs
  });
});
