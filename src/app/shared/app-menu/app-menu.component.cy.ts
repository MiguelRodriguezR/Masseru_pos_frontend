import { AppMenuComponent } from './app-menu.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

// This is a component test for the AppMenuComponent
// To run this test, use the command: npx cypress open --component

describe('AppMenuComponent', () => {
  let routerStub: any;
  let authServiceStub: any;

  beforeEach(() => {
    // Inicializa los stubs dentro del contexto de ejecución
    routerStub = { navigate: cy.stub().as('routerNavigate') };
    authServiceStub = { logout: cy.stub().as('authLogout') };

    cy.mount(AppMenuComponent, {
      imports: [
        CommonModule, // Para la directiva *ngFor
        MatIconModule, // Para mat-icon
        MatCardModule, // En caso de que el componente use mat-card
        MatGridListModule // En caso de que use grid layout
      ],
      providers: [
        { provide: Router, useValue: routerStub },
        { provide: AuthService, useValue: authServiceStub }
      ]
    });
  });

  it('should render the component with title and logo', () => {
    cy.get('.app-menu-title img')
      .should('be.visible')
      .and('have.attr', 'src', 'assets/title.png')
      .and('have.attr', 'alt', 'Descripción de la imagen')
      .and('have.attr', 'style', 'width: 250px;');
  });

  it('should display all menu items', () => {
    cy.get('.menu-item').should('have.length', 10);

    // Verify menu items text and icons
    const expectedMenuItems = [
      { name: 'Dashboard', icon: 'dashboard' },
      { name: 'POS', icon: 'point_of_sale' },
      { name: 'Productos', icon: 'inventory_2' },
      { name: 'Compras', icon: 'shopping_cart' },
      { name: 'Recibos', icon: 'receipt' },
      { name: 'Ventas', icon: 'trending_up' },
      { name: 'Gastos Operativos', icon: 'account_balance_wallet' },
      { name: 'Métodos de Pago', icon: 'payments' },
      { name: 'Usuarios', icon: 'people' },
      { name: 'Cerrar Session', icon: 'logout' }
    ];

    expectedMenuItems.forEach((item, index) => {
      cy.get('.menu-item').eq(index).within(() => {
        cy.get('.menu-item-name').should('contain.text', item.name);
        cy.get('mat-icon').should('contain.text', item.icon);
      });
    });
  });

  it('should navigate to the correct route when clicking a menu item', () => {
    // Click on Dashboard menu item (first item)
    cy.get('.menu-item').eq(0).click();
    cy.get('@routerNavigate').should('have.been.calledWith', ['/dashboard']);

    // Click on POS menu item (second item)
    cy.get('.menu-item').eq(1).click();
    cy.get('@routerNavigate').should('have.been.calledWith', ['/pos']);

    // Click on Products menu item (third item)
    cy.get('.menu-item').eq(2).click();
    cy.get('@routerNavigate').should('have.been.calledWith', ['/products']);
  });

  it('should call logout and navigate to login when clicking logout button', () => {
    // Click on logout menu item (last item)
    cy.get('.menu-item').last().click();
    
    // Verify logout was called
    cy.get('@authLogout').should('have.been.called');
    
    // Verify navigation to login page
    cy.get('@routerNavigate').should('have.been.calledWith', ['/login']);
  });

  it('should apply hover effects on menu items', () => {
    // Trigger hover on first menu item
    cy.get('.menu-item').first().realHover();
    
    // Check that the transform style is applied
    cy.get('.menu-item').first().should('have.css', 'transform')
      .and('not.equal', 'none');
    
    // Check that the background color of the icon container changes
    cy.get('.menu-item').first().find('.menu-icon-container')
      .should('have.css', 'background-color')
      .and('not.equal', 'rgb(255, 255, 255)'); // Not white
  });

  it('should have responsive design', () => {
    
    // Test small screen size
    cy.viewport('iphone-6');
    cy.get('.app-menu-container').should('have.css', 'padding')
      .and('not.equal', '24px'); // Should be smaller padding
    
    cy.get('.menu-item-name').should('have.css', 'font-size')
      .and('not.equal', '16px'); // Should be smaller font size
  });
});
