/// <reference types="cypress" />
import { generateToken } from '../../support/commands';

describe('Login Component', () => {
  beforeEach(() => {
    // Visit login page before each test
    cy.visit('/login');
  });

  it('should display the login form correctly', () => {
    // Check logo
    cy.get('.illustration img')
      .should('be.visible')
      .and('have.attr', 'src', 'assets/logo.png')
      .and('have.attr', 'alt', 'Descripción de la imagen');

    // Check title
    cy.get('h1').should('contain.text', '¡Bienvenido!');

    // Check email field
    cy.get('input[formControlName="email"]')
      .should('be.visible')
      .and('have.attr', 'placeholder', 'Tu correo electrónico')
      .and('have.attr', 'type', 'email')
      .and('have.attr', 'autocomplete', 'email');

    // Check password field
    cy.get('input[formControlName="password"]')
      .should('be.visible')
      .and('have.attr', 'placeholder', 'Tu contraseña')
      .and('have.attr', 'type', 'password')
      .and('have.attr', 'autocomplete', 'current-password');

    // Check login button
    cy.get('.sign-in-btn')
      .should('be.visible')
      .and('contain.text', 'Iniciar sesión')
      .and('be.disabled');

    // Check create account link
    cy.get('.create-account-btn')
      .should('be.visible')
      .and('contain.text', 'Crear cuenta')
      .and('have.attr', 'href');
  });

  it('should validate form inputs', () => {
    // Test invalid email
    cy.get('input[formControlName="email"]').type('invalid-email');
    cy.get('input[formControlName="email"]').blur();
    cy.get('input[formControlName="email"]').should('have.class', 'invalid');
    cy.get('.sign-in-btn').should('be.disabled');

    // Test valid email
    cy.get('input[formControlName="email"]').clear().type('valid@email.com');
    cy.get('input[formControlName="email"]').should('not.have.class', 'invalid');
    cy.get('.sign-in-btn').should('be.disabled');

    // Test password validation
    cy.get('input[formControlName="password"]').type('pass');
    cy.get('input[formControlName="password"]').blur();
    cy.get('.sign-in-btn').should('not.be.disabled');
  });

  it('should show loading state during login', function() {
    if (Cypress.browser.isHeadless) {
        this.skip();
    }

    // Fill valid form
    cy.get('input[formControlName="email"]').type('valid@email.com');
    cy.get('input[formControlName="password"]').type('password');
    
    // Mock successful login response
    cy.intercept('POST', '**/login', {
      statusCode: 200,
      body: { token: 'fake-jwt-token' }
    }).as('loginRequest');

    // Submit form
    cy.get('.sign-in-btn').click();
    
    // Check loading state
    cy.get('.sign-in-btn').should('be.disabled');
    cy.get('.spinner').should('be.visible');
    cy.get('.rotating').should('be.visible');
  });

  it('should handle successful login', () => {
    // Fill valid form
    cy.get('input[formControlName="email"]').type('valid@email.com');
    cy.get('input[formControlName="password"]').type('password');
    
    
    // Mock successful login and user data responses
    cy.getValidToken().then(token => {
      cy.intercept('POST', '**/login', {
        statusCode: 200,
        body: { token: token }
      }).as('loginRequest');
  
      cy.intercept('GET', '**/user/data', {
        statusCode: 200,
        body: { user: 'test-user' }
      }).as('userDataRequest');
  
      // Submit form
      cy.get('.sign-in-btn').click();
      
      // Verify navigation to dashboard
      cy.url().should('include', '/dashboard');
    })
    
  });

  it('should show error message on invalid credentials', () => {
    // Fill valid form
    cy.get('input[formControlName="email"]').type('valid@email.com');
    cy.get('input[formControlName="password"]').type('wrong-password');
    
    // Mock failed login
    cy.intercept('POST', '**/login', {
      statusCode: 401,
      body: { msg: 'Credenciales inválidas' }
    }).as('loginRequest');

    // Submit form
    cy.get('.sign-in-btn').click();
    
    // Verify error message
    cy.get('.error-message')
      .should('be.visible')
      .and('contain.text', 'Credenciales inválidas');
  });

  it('should show SweetAlert for pending approval', () => {
    // Fill valid form
    cy.get('input[formControlName="email"]').type('valid@email.com');
    cy.get('input[formControlName="password"]').type('password');
    
    // Mock pending approval response
    cy.intercept('POST', '**/login', {
      statusCode: 403,
      body: { msg: 'pendiente de aprobación' }
    }).as('loginRequest');

    // Submit form
    cy.get('.sign-in-btn').click();
    
    // Verify SweetAlert appears
    cy.get('.swal2-popup').should('be.visible');
    cy.get('.swal2-title').should('contain.text', 'Cuenta pendiente de aprobación');
    cy.get('.swal2-confirm').should('contain.text', 'Entendido');
  });

  it('should be responsive', () => {
    // Test medium screen size
    cy.viewport('ipad-2');
    cy.get('.auth-card').should('have.css', 'flex-direction', 'column');
    cy.get('.illustration-side .illustration').should('have.css', 'max-width', '200px');

    // Test small screen size
    cy.viewport('iphone-6');
    cy.get('.auth-container').should('have.css', 'padding', '8px');
    // cy.get('.form-side h1').should('have.css', 'font-size', '20px');
    cy.get('input[formControlName="email"]').should('have.css', 'font-size', '14px');
  });
});
