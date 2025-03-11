import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  template: `
    <app-base-card [title]="title" cardWidth="third">
      <ng-content></ng-content>
    </app-base-card>
  `,
  styleUrls: ['./stat-card.component.scss']
})
export class StatCardComponent {
  @Input() title: string = '';
}
