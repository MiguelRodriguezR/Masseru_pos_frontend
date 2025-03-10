import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string = '';
  passwordStrength: number = 0;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['seller']
    });
  }

  ngOnInit(): void {}

  checkPasswordStrength() {
    const password = this.registerForm.get('password')?.value;
    
    if (!password) {
      this.passwordStrength = 0;
      return;
    }
    
    // Calculate password strength
    let strength = 0;
    
    // Length check
    if (password.length >= 8) {
      strength += 1;
    }
    
    // Complexity checks
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // Add points for complexity
    if ((hasUpperCase && hasLowerCase) || (hasNumbers && hasSpecialChars)) {
      strength += 1;
    }
    
    if (hasUpperCase && hasLowerCase && (hasNumbers || hasSpecialChars)) {
      strength += 1;
    }
    
    this.passwordStrength = strength;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const { name, email, password, role } = this.registerForm.value;
      this.authService.register(name, email, password, role)
        .subscribe({
          next: (res) => {
            this.router.navigate(['/login']);
          },
          error: (err) => {
            this.errorMessage = err.error.msg || 'Error al registrar usuario';
          }
        });
    }
  }
}
