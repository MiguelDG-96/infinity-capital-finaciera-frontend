import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { PRODUCTS_DATA, DIGITAL_CHANNELS_DATA, BENEFITS_DATA, ProductUpdated } from '../../../core/constants/menu-data';

@Component({
  selector: 'app-secondarybar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
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
    } else {
      this.activeMenu.set(null);
    }
  }
}
