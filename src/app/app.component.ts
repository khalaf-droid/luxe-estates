import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <app-cursor></app-cursor>
    <app-nav></app-nav>
    <router-outlet></router-outlet>
    <app-notification></app-notification>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AppComponent {
  title = 'luxe-estates';
}
