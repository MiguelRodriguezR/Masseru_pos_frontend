import { Component, Input, HostBinding } from '@angular/core';

@Component({
  selector: 'app-base-card',
  template: `
    <div class="dashboard-card">
      <div class="card-header">
        <h2>{{ title }}</h2>
        <div class="card-actions" *ngIf="showActions">
          <ng-content select="[card-actions]"></ng-content>
        </div>
      </div>
      <div class="card-content" [ngClass]="{'chart-container': isChartCard}">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./base-card.component.scss']
})
export class BaseCardComponent {
  @Input() title: string = '';
  @Input() cardWidth: 'quarter' | 'third' | 'half' | 'full' = 'full';
  @Input() isChartCard: boolean = false;
  @Input() showActions: boolean = false;

  @HostBinding('class') get hostClasses(): string {
    return this.cardWidth + '-width';
  }
}
