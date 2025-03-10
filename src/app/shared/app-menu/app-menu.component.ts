import { Component } from '@angular/core';
import { Router } from '@angular/router';

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
    { name: 'Products', route: '/products', icon: 'inventory_2' },
    { name: 'Receipts', route: '/receipts', icon: 'receipt' },
    { name: 'Sales', route: '/sales', icon: 'trending_up' },
    { name: 'Users', route: '/users', icon: 'people' }
  ];

  constructor(private router: Router) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
