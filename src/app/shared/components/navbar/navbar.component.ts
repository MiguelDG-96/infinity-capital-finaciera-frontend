import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { PRODUCTS_DATA, DIGITAL_CHANNELS_DATA, BENEFITS_DATA } from '../../../core/constants/menu-data';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  // Mobile Menu State
  isMobileMenuOpen = signal(false);
  
  // Accordion State
  activeAccordion = signal<string | null>(null);
  activeSubAccordion = signal<string | null>(null);
  
  // Data
  products = PRODUCTS_DATA;
  digitalChannels = DIGITAL_CHANNELS_DATA;
  benefits = BENEFITS_DATA;
  
  // Segments (from Topbar)
  segments = ['Personas', 'PyMES', 'Empresas'];
  activeSegment = signal('Personas');

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
    if (!this.isMobileMenuOpen()) {
      this.activeAccordion.set(null);
      this.activeSubAccordion.set(null);
    }
  }

  toggleAccordion(id: string) {
    this.activeAccordion.update(current => current === id ? null : id);
  }

  toggleSubAccordion(id: string) {
    this.activeSubAccordion.update(current => current === id ? null : id);
  }
}
