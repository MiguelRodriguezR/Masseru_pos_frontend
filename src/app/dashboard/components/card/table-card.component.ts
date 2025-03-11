import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-table-card',
  template: `
    <app-base-card [title]="title" cardWidth="full">
      <div class="table-container">
        <ng-content></ng-content>
      </div>
    </app-base-card>
  `,
  styleUrls: ['./table-card.component.scss']
})
export class TableCardComponent {
  @Input() title: string = '';
}
