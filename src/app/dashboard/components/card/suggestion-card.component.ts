import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-suggestion-card',
  template: `
    <app-base-card [title]="title" cardWidth="full">
      <ng-content></ng-content>
    </app-base-card>
  `,
  styleUrls: ['./suggestion-card.component.scss']
})
export class SuggestionCardComponent {
  @Input() title: string = '';
}
