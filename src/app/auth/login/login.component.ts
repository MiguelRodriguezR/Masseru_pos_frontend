import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { UserDataService } from '../../shared/user-data.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router,
    private userDataService: UserDataService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value.email, this.loginForm.value.password)
        .subscribe({
          next: (res) => {
            this.authService.setToken(res.token);
            
            // Load user data after successful login
            const userData = this.userDataService.loadUserData();
            if (userData) {
              userData.subscribe({
                next: () => {
                  this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                  console.error('Error loading user data:', err);
                  this.router.navigate(['/dashboard']);
                }
              });
            } else {
              this.router.navigate(['/dashboard']);
            }
          },
          error: (err) => {
            this.errorMessage = err.error.msg || 'Error al iniciar sesión';
          }
        });
    }
  }
}
