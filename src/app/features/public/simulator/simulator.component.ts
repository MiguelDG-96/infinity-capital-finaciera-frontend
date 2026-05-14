import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TasasService } from '../../../core/services/tasas.service';
import { TipoCredito } from '../../../core/models/tasas.model';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  template: `
    <div class="container mx-auto px-4 py-12 relative">
      <div class="max-w-6xl mx-auto relative group">
        
        <!-- Ribbon Tag (Inspired by Mi Espacio Capital) -->
        <div class="absolute top-6 -left-2 z-30 filter drop-shadow-md">
          <div class="bg-red-600 text-sm md:text-base text-white font-black py-2 px-10 rounded-tl-xl rounded-r-3xl relative uppercase tracking-widest">
            Simulador Infiny
            <!-- Fold Triangle Effect -->
            <div class="absolute left-0 top-full w-2 h-2 rounded-bl-xl bg-red-800"></div>
          </div>
        </div>

        <!-- Main Card -->
        <div class="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden md:flex border border-gray-100 relative z-10 min-h-[650px]">
          
          <!-- Left Column: Simulator Form -->
          <div class="w-full md:w-1/2 p-8 md:p-12 lg:p-16 pt-24 md:pt-16 bg-gradient-to-br from-white to-gray-50 flex flex-col justify-center">
            
            <div class="mb-8">
              <h2 class="text-4xl font-black text-gray-900 tracking-tight mb-2">Simula tu éxito</h2>
              <p class="text-gray-500 font-medium">Obtén una cuota a tu medida en segundos.</p>
            </div>
            
            <div class="space-y-6 mb-8">
              <div class="space-y-2">
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Producto Financiero</label>
                <select [(ngModel)]="selectedTipoId" 
                        class="select select-bordered w-full rounded-2xl bg-white border-gray-200 focus:border-blue-500 transition-all font-bold h-[60px] text-lg shadow-sm">
                  <option *ngFor="let tipo of tipos()" [value]="tipo.id">{{ tipo.nombre }}</option>
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Monto deseado</label>
                  <div class="relative">
                    <span class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black z-10 text-lg">S/</span>
                    <input type="number" [(ngModel)]="amount" 
                           class="input input-bordered w-full rounded-2xl bg-white border-gray-200 focus:border-blue-500 transition-all font-black pl-12 h-[60px] text-xl shadow-sm" 
                           placeholder="0.0">
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Meses a pagar</label>
                  <div class="relative">
                    <input type="number" [(ngModel)]="term" 
                           class="input input-bordered w-full rounded-2xl bg-white border-gray-200 focus:border-blue-500 transition-all font-black h-[60px] text-xl shadow-sm" 
                           placeholder="12">
                    <span class="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[10px]">MESES</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botón de Acción -->
            <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group text-lg" 
                    type="button"
                    routerLink="/register">
              SOLICITAR AHORA
              <lucide-icon name="arrow-right" class="w-6 h-6 group-hover:translate-x-2 transition-transform"></lucide-icon>
            </button>
            
            <p class="text-[10px] text-gray-400 mt-6 font-medium leading-relaxed italic text-center md:text-left">
              * Tasas sujetas a evaluación. Infiny Capital © 2026.
            </p>
          </div>

          <!-- Right Column: Result & Visual -->
          <div class="w-full md:w-1/2 relative bg-gray-900 flex flex-col items-center justify-center p-12 text-center">
            <!-- Background Image Overlay -->
            <img src="/finance_simulator_side_image_1778778266656.png" 
                 class="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" 
                 alt="Background">
            
            <div class="relative z-10 w-full">
              <div class="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 py-2 px-4 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-blue-500/30">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Cuota mensual estimada
              </div>

              <div class="flex items-center justify-center gap-2 mb-2">
                <span class="text-3xl text-white/40 font-light mt-4 italic">S/</span>
                <p class="text-8xl font-black text-white tracking-tighter leading-none shadow-blue-500/50">
                  {{ calculateQuota() | number:'1.1-1' }}
                </p>
              </div>
              
              <div class="mt-8 space-y-2">
                <div class="h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>
                <p class="text-white/60 text-sm font-medium">Tasa aplicada: <span class="text-white font-bold">{{ currentRate() }}% TEM</span></p>
              </div>
            </div>

            <!-- Footer decor -->
            <div class="absolute bottom-12 left-1/2 -translate-x-1/2 w-full px-12">
               <div class="flex items-center justify-between opacity-30">
                  <div class="h-[1px] flex-1 bg-white/20"></div>
                  <lucide-icon name="sparkles" class="w-4 h-4 text-white mx-4"></lucide-icon>
                  <div class="h-[1px] flex-1 bg-white/20"></div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `]
})
export class SimulatorComponent implements OnInit {
  private tasasService = inject(TasasService);
  
  tipos = signal<TipoCredito[]>([]);
  selectedTipoId: number | null = null;
  amount = 5000;
  term = 12;
  Math = Math;

  ngOnInit() {
    this.tasasService.getTiposPublicos().subscribe(tipos => {
      this.tipos.set(tipos);
      if (tipos.length > 0) {
        this.selectedTipoId = tipos[0].id;
      }
    });
  }

  currentRate() {
    const tipoId = this.selectedTipoId;
    const amount = this.amount;
    const tipo = this.tipos().find(t => t.id == tipoId);
    
    if (!tipo) return 5; // Default fallback

    // Buscar en rangos
    if (tipo.rangos && tipo.rangos.length > 0) {
      const rango = tipo.rangos.find(r => amount >= r.montoMinimo && amount <= r.montoMaximo);
      if (rango) return rango.tasaMensual;
    }

    return tipo.temDefecto;
  }

  calculateQuota(): number {
    const p = this.amount;
    const n = this.term;
    if (p <= 0 || n <= 0) return 0;
    
    // Tasa mensual en decimal
    const i = this.currentRate() / 100;
    
    if (i === 0) return p / n;

    // Fórmula Francesa: R = P * (i * (1 + i)^n) / ((1 + i)^n - 1)
    const factor = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    const result = p * factor;
    return Math.round(result * 10) / 10;
  }
}
