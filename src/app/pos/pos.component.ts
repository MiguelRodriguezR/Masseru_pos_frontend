import { Component, OnInit, OnDestroy } from '@angular/core';
import { PosSessionService } from './pos-session.service';
import { UserDataService } from '../shared/user-data.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss']
})
export class PosComponent implements OnInit, OnDestroy {
  // Track all subscriptions for cleanup
  private subscriptions: Subscription[] = [];
  products: any[] = [];
  cart: any[] = [];
  searchTerm: string = '';
  
  // POS Session related properties
  hasOpenSession: boolean = false;
  sessionData: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private posSessionService: PosSessionService,
    private userDataService: UserDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkUserSession();
  }

  /**
   * Check if the current user has an open POS session
   */
  checkUserSession(): void {
    const userId = this.userDataService.getUserId();
    
    if (!userId) {
      this.errorMessage = 'No se pudo obtener el ID del usuario. Por favor, inicie sesión nuevamente.';
      this.isLoading = false;
      return;
    }

    const subscription = this.posSessionService.getUserOpenSession(userId).subscribe({
      next: (response) => {
        this.hasOpenSession = response.hasOpenSession;
        if (response.hasOpenSession) {
          this.sessionData = response.session;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al verificar la sesión de POS:', error);
        
        // Check if this is a 404 response with the "no open session" message
        if (error.status === 404 && error.error && error.error.hasOpenSession === false) {
          // This is not an error, it's a valid response indicating no open session
          this.hasOpenSession = false;
          this.isLoading = false;
        } else {
          // This is a real error
          this.errorMessage = 'Error al verificar la sesión de POS. Por favor, intente nuevamente.';
          this.isLoading = false;
        }
      }
    });
    
    // Add subscription to the array for later cleanup
    this.subscriptions.push(subscription);
  }

  /**
   * Continue with existing POS session
   */
  continuePosSession(): void {
    if (this.sessionData && this.sessionData._id) {
      this.router.navigate(['/pos/session', this.sessionData._id]);
    } else {
      this.errorMessage = 'No se pudo obtener la información de la sesión.';
    }
  }

  /**
   * Create a new POS session
   */
  createPosSession(): void {
    Swal.fire({
      title: 'Cantidad inicial de dinero',
      input: 'number',
      inputLabel: 'Ingrese la cantidad inicial de dinero en caja',
      inputPlaceholder: 'Cantidad en pesos',
      inputAttributes: {
        min: '0',
        step: '1000'
      },
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar una cantidad';
        }
        if (Number(value) < 0) {
          return 'La cantidad no puede ser negativa';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const initialCash = Number(result.value);
        
        const subscription = this.posSessionService.openSession(initialCash).subscribe({
          next: (response) => {
            if (response && response.session && response.session._id) {
              this.router.navigate(['/pos/session', response.session._id]);
            } else {
              this.errorMessage = 'Error al crear la sesión POS.';
            }
          },
          error: (error) => {
            console.error('Error al crear la sesión POS:', error);
            this.errorMessage = 'Error al crear la sesión POS. Por favor, intente nuevamente.';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error al crear la sesión POS. Por favor, intente nuevamente.'
            });
          }
        });
        
        // Add subscription to the array for later cleanup
        this.subscriptions.push(subscription);
      }
    });
  }

  /**
   * View POS sessions list
   */
  viewPosSessionsList(): void {
    console.log("e")
    this.router.navigate(['/pos/sessions']);
  }
  
  /**
   * Cleanup subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.subscriptions.forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
  }
}
