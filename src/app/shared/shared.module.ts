import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppMenuComponent } from './app-menu/app-menu.component';
import { HeaderComponent } from './header/header.component';
import { EnvironmentSelectorComponent } from './environment-selector/environment-selector.component';
import { CypressLogsService } from './cypress-logs.service';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@NgModule({
  declarations: [
    AppMenuComponent,
    HeaderComponent,
    EnvironmentSelectorComponent
  ],
  providers: [
    CypressLogsService
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatCardModule,
    MatGridListModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  exports: [
    AppMenuComponent,
    HeaderComponent,
    EnvironmentSelectorComponent
  ]
})
export class SharedModule { }
