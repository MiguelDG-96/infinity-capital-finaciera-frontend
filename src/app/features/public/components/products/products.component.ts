import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, User, Store, Building, Home, ArrowRight } from 'lucide-angular';

interface Product {
  title: string;
  subtitle: string;
  iconName: string;
  link?: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './products.component.html',
})
export class ProductsComponent {
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
