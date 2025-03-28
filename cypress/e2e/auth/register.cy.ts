/// <reference types="cypress" />

describe('Register Component', () => {
  beforeEach(() => {
    cy.visitPublicRoute('/login/register');
  });

  it('should display the register form correctly', () => {
    // Check logo
    cy.get('.illustration img')
      .should('be.visible')
      .and('have.attr', 'src', 'assets/logo.png')
      .and('have.attr', 'alt', 'Descripción de la imagen');

    // Check title
    cy.get('h1').should('contain.text', 'Crear cuenta');

    // Check name field
    cy.get('input[formControlName="name"]')
      .should('be.visible')
      .and('have.attr', 'placeholder', 'Tu nombre')
      .and('have.attr', 'type', 'text')
      .and('have.attr', 'autocomplete', 'name');

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
      .and('have.attr', 'autocomplete', 'new-password');

    // Check role selector
    cy.get('select[formControlName="role"]')
      .should('be.visible')
      .and('contain.text', 'Selecciona un rol');

    // Check submit button
    cy.get('.create-account-btn')
      .should('be.visible')
      .and('contain.text', 'Crear cuenta')
      .and('be.disabled');

    // Check login link
    cy.get('.sign-in-btn')
      .should('be.visible')
      .and('contain.text', 'Ya tengo una cuenta');
  });

  it('should validate form inputs', () => {
    // Test invalid email
    cy.get('input[formControlName="email"]').type('invalid-email');
    cy.get('input[formControlName="email"]').blur();
    cy.get('input[formControlName="email"]').should('have.class', 'invalid');
    cy.get('.create-account-btn').should('be.disabled');

    // Test valid email
    cy.get('input[formControlName="email"]').clear().type('valid@email.com');
    cy.get('input[formControlName="email"]').should('not.have.class', 'invalid');

    // Test name validation
    cy.get('input[formControlName="name"]').type('Test User');
    cy.get('input[formControlName="name"]').blur();
    cy.get('input[formControlName="name"]').should('not.have.class', 'invalid');

    // Test password validation
    cy.get('input[formControlName="password"]').type('password123');
    cy.get('input[formControlName="password"]').blur();
    cy.get('.create-account-btn').should('not.be.disabled');
  });

  it('should show password strength meter', () => {
    cy.get('input[formControlName="password"]').type('12345678');
    cy.get('.password-strength').should('be.visible');
    cy.get('.strength-segment').first().should('have.class', 'active');
    cy.get('.strength-segment').last().should('not.have.class', 'active');

    cy.get('input[formControlName="password"]').clear().type('Stronger123!');
    cy.get('.strength-segment').last().should('have.class', 'active');
  });

  it('should handle successful registration', () => {
    // Fill valid form
    cy.get('input[formControlName="name"]').type('Test User');
    cy.get('input[formControlName="email"]').type('test@example.com');
    cy.get('input[formControlName="password"]').type('Test123!');
    cy.get('select[formControlName="role"]').select('seller');
    
    // Mock successful registration response
    cy.intercept('POST', '**/register', {
      statusCode: 200,
      body: { msg: 'Usuario registrado exitosamente' }
    }).as('registerRequest');

    // Submit form
    cy.get('.create-account-btn').click();
    
    // Verify SweetAlert appears
    cy.get('.swal2-popup').should('be.visible');
    cy.get('.swal2-title').should('contain.text', '¡Registro exitoso!');
    cy.get('.swal2-confirm').should('contain.text', 'Entendido');
  });

  it('should show error message on registration failure', () => {
    // Fill valid form
    cy.get('input[formControlName="name"]').type('Test User');
    cy.get('input[formControlName="email"]').type('test@example.com');
    cy.get('input[formControlName="password"]').type('Test123!');
    cy.get('select[formControlName="role"]').select('seller');
    
    // Mock failed registration
    cy.intercept('POST', '**/register', {
      statusCode: 400,
      body: { msg: 'El correo ya está registrado' }
    }).as('registerRequest');

    // Submit form
    cy.get('.create-account-btn').click();
    
    // Verify error message
    cy.get('.error-message')
      .should('be.visible')
      .and('contain.text', 'El correo ya está registrado');
  });

  it('should be responsive', () => {
    // Test medium screen size
    cy.viewport('ipad-2');
    cy.get('.auth-card').should('have.css', 'flex-direction', 'column');
    cy.get('.illustration-side .illustration').should('have.css', 'max-width', '200px');

    // Test small screen size
    cy.viewport('iphone-6');
    cy.get('.auth-container').should('have.css', 'padding', '8px');
    cy.get('input[formControlName="name"]').should('have.css', 'font-size', '14px');
  });
});
