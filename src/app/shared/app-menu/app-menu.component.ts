import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

interface MenuItem {
  name: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss']
})
export class AppMenuComponent {
  menuItems: MenuItem[] = [
    { name: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { name: 'POS', route: '/pos', icon: 'point_of_sale' },
    { name: 'Productos', route: '/products', icon: 'inventory_2' },
    { name: 'Recibos', route: '/receipts', icon: 'receipt' },
    { name: 'Ventas', route: '/sales', icon: 'trending_up' },
    { name: 'Métodos de Pago', route: '/payment-methods', icon: 'payments' },
    { name: 'Usuarios', route: '/users', icon: 'people' },
  ];

  constructor(private router: Router, private authService: AuthService) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
