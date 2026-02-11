import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroComponent } from '../components/hero/hero.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, HeroComponent],
  template: `
    <app-hero></app-hero>
    <div class="container mx-auto px-4 py-16 text-center">
      <h2 class="text-4xl font-bold text-gray-900 mb-4">Tu futuro financiero comienza aquí</h2>
      <p class="text-xl text-gray-600 mb-8">Préstamos rápidos, seguros y a tu medida.</p>
      <div class="flex justify-center gap-4">
        <a routerLink="/simulator" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Simular Préstamo</a>
        <a routerLink="/login" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Iniciar Sesión</a>
      </div>
    </div>
  `,
  styles: []
})
export class LandingComponent {}
