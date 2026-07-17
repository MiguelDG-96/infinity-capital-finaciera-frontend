import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ScrollRevealDirective } from '../../../../../shared/directives/scroll-reveal.directive';


@Component({
  selector: 'app-creditos-personales',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, ScrollRevealDirective],
  templateUrl: './creditos-personales.component.html'
})
export class CreditosPersonalesComponent {}
