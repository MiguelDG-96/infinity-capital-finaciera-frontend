import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {}
