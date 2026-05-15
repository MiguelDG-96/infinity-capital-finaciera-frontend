import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroComponent } from '../components/hero/hero.component';
import { ProductsComponent } from '../components/products/products.component';
import { StoreComponent } from '../components/store/store.component';
import { DigitalChannelsComponent } from '../components/digital-channels/digital-channels.component';
import { InfinyCapitalInfoComponent } from '../components/infinycapital-info/infinycapital-info.component';
import { BenefitsComponent } from '../components/benefits/benefits.component';
import { LocationComponent } from '../components/location/location.component';
import { LucideAngularModule } from 'lucide-angular';


@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    RouterLink, 
    HeroComponent, 
    ProductsComponent, 
    StoreComponent, 
    DigitalChannelsComponent, 
    InfinyCapitalInfoComponent, 
    BenefitsComponent,
    LocationComponent,
    LucideAngularModule
  ],
  template: `
    <app-hero></app-hero>
    <app-products></app-products>
    <app-store></app-store>
    <app-digital-channels></app-digital-channels>
    <app-infinycapital-info></app-infinycapital-info>
    <app-benefits></app-benefits>
    <app-location></app-location>
    <section class="py-24 bg-white border-t border-gray-100">
      <div class="container mx-auto px-4 text-center">
        <div class="max-w-2xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Tu futuro financiero <span class="text-red-600 font-extrabold">comienza aquí</span>
          </h2>
          
          <p class="text-gray-500 text-lg mb-10">
            Préstamos rápidos, seguros y a tu medida con el respaldo de InfinyCapital.
          </p>
          
          <div class="flex flex-col sm:flex-row justify-center items-center gap-6">
            <a 
              routerLink="/simulator" 
              class="w-full sm:w-auto px-10 py-4 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-all shadow-lg shadow-red-600/10 active:scale-95"
            >
              Simular Préstamo
            </a>
            <a 
              routerLink="/login" 
              class="text-gray-500 font-bold hover:text-gray-900 transition-colors"
            >
              Iniciar Sesión
            </a>
          </div>

          <div class="mt-16 flex justify-center items-center gap-8 opacity-40">
            <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <lucide-icon name="shield-check" class="w-4 h-4"></lucide-icon>
              Seguro
            </div>
            <div class="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <lucide-icon name="zap" class="w-4 h-4"></lucide-icon>
              Rápido
            </div>
            <div class="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <lucide-icon name="award" class="w-4 h-4"></lucide-icon>
              Preferencial
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class LandingComponent {}
