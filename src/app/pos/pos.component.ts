import { Component, OnInit } from '@angular/core';
import { ProductService } from '../products/product.service';
import { SaleService } from '../sales/sale.service';

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html'
})
export class PosComponent implements OnInit {
  products: any[] = [];
  cart: any[] = [];
  searchTerm: string = '';

  constructor(private productService: ProductService, private saleService: SaleService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error(err)
    });
  }

  addToCart(product: any) {
    // Lógica simple: se agrega el producto con cantidad 1
    this.cart.push({ productId: product._id, quantity: 1 });
  }

  checkout() {
    if(this.cart.length > 0) {
      this.saleService.createSale({ items: this.cart }).subscribe({
        next: (res) => {
          alert('Venta realizada');
          this.cart = [];
        },
        error: (err) => console.error(err)
      });
    }
  }
}
