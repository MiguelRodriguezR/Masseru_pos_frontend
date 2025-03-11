import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-summary-stat-card',
  template: `
    <app-base-card [title]="title" cardWidth="quarter">
      <div class="stat-card">
        <div class="stat-value">{{ value }}</div>
        <div class="stat-label">{{ label }}</div>
      </div>
    </app-base-card>
  `,
  styleUrls: ['./summary-stat-card.component.scss']
})
export class SummaryStatCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() label: string = '';
}
