import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { PRODUCTS_DATA, DIGITAL_CHANNELS_DATA, BENEFITS_DATA, ProductUpdated } from '../../../core/constants/menu-data';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-secondarybar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ScrollRevealDirective],
  templateUrl: './secondarybar.component.html',
})
export class SecondarybarComponent {
  activeMenu = signal<string | null>(null);

  products: ProductUpdated[] = PRODUCTS_DATA;
  digitalChannels = DIGITAL_CHANNELS_DATA;
  benefits = BENEFITS_DATA;

  activeCategory = signal(this.products[0]);

  toggleMenu(menuName: string, state: boolean) {
    if (state) {
      this.activeMenu.set(menuName);
      // Reset active category to the first one when opening products menu
      if (menuName === 'products' && this.products.length > 0) {
        this.activeCategory.set(this.products[0]);
      }
    } else {
      this.activeMenu.set(null);
    }
  }
}
