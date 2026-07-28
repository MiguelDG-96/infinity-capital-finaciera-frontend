import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, User, Store, Building, Home, ArrowRight } from 'lucide-angular';

interface Product {
  title: string;
  subtitle: string;
  iconName: string;
  link?: string;
}

import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, ScrollRevealDirective],
  templateUrl: './products.component.html',
})
export class ProductsComponent {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  // Drag to Scroll Logic
  isDown = false;
  startX = 0;
  scrollLeft = 0;

  onMouseDown(e: MouseEvent) {
    this.isDown = true;
    this.startX = e.pageX - this.scrollContainer.nativeElement.offsetLeft;
    this.scrollLeft = this.scrollContainer.nativeElement.scrollLeft;
  }

  onMouseLeave() {
    this.isDown = false;
  }

  onMouseUp() {
    this.isDown = false;
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDown) return;
    e.preventDefault();
    const x = e.pageX - this.scrollContainer.nativeElement.offsetLeft;
    const walk = (x - this.startX) * 2; // Scroll-fast
    this.scrollContainer.nativeElement.scrollLeft = this.scrollLeft - walk;
  }
  products: Product[] = [
    {
      title: 'Créditos Personales',
      subtitle: 'Soluciones rápidas para tus necesidades personales.',
      iconName: 'user',
      link: '/creditos-personales'
    },
    {
      title: 'Créditos para Negocio',
      subtitle: 'Impulsa tu negocio y hazlo crecer con nuestro apoyo.',
      iconName: 'store'
    },
    {
      title: 'Créditos para Empresa',
      subtitle: 'Financiamiento a la medida para tu empresa.',
      iconName: 'building',
      link: '/creditos-empresas'
    },
    {
      title: 'Créditos Hipotecarios',
      subtitle: 'Haz realidad el sueño de tu casa propia.',
      iconName: 'home'
    }
  ];
}
