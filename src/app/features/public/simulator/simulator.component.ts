import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg mt-10">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">Simulador de Crédito</h2>
      
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">Monto del Préstamo (S/)</label>
        <input type="number" [(ngModel)]="amount" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Ej: 5000">
      </div>

      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">Plazo (Meses)</label>
        <input type="number" [(ngModel)]="term" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Ej: 12">
      </div>

      <div class="mb-6">
        <p class="text-gray-600">Cuota Mensual Estimada:</p>
        <p class="text-3xl font-bold text-blue-600">{{ calculateQuota() | currency:'PEN' }}</p>
      </div>

      <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
        Solicitar Ahora
      </button>
    </div>
  `,
  styles: []
})
export class SimulatorComponent {
  amount: number = 5000;
  term: number = 12;
  rate = 0.05; // 5% mensual simplificado

  calculateQuota(): number {
    const p = this.amount;
    const n = this.term;
    if (p <= 0 || n <= 0) return 0;
    
    // Fórmula simple de cuota fija: R = P * (i * (1 + i)^n) / ((1 + i)^n - 1)
    const i = this.rate;
    return p * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
  }
}
