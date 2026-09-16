import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';

interface PuntoProyeccion {
  mes: number;
  capitalAcumulado: number;
  interesAcumulado: number;
  total: number;
}

@Component({
  selector: 'app-simulador-inversionista',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  templateUrl: './simulador-inversionista.component.html',
  styleUrl: './simulador-inversionista.component.css',
})
export class SimuladorInversionistaComponent {

  // Inputs del simulador
  monto      = signal(10000);
  plazoMeses = signal(12);
  tasaAnual  = signal(3);
  moneda     = signal('PEN');

  plazosDisponibles = [3, 6, 12, 18, 24, 36];
  monedas = [
    { codigo: 'PEN', simbolo: 'S/.', nombre: 'Sol Peruano' },
    { codigo: 'USD', simbolo: '$',   nombre: 'Dólar' },
    { codigo: 'EUR', simbolo: '€',   nombre: 'Euro' },
  ];

  // Computed: cálculo del interés simple
  interesTotal = computed(() => {
    const plazoAnios = this.plazoMeses() / 12;
    return +(this.monto() * (this.tasaAnual() / 100) * plazoAnios).toFixed(2);
  });

  montoFinal = computed(() => +(this.monto() + this.interesTotal()).toFixed(2));

  rendimientoMensual = computed(() => +(this.interesTotal() / this.plazoMeses()).toFixed(2));

  // Datos del gráfico de barras (proyección mensual)
  proyeccion = computed<PuntoProyeccion[]>(() => {
    const puntos: PuntoProyeccion[] = [];
    const tasaMensual = this.tasaAnual() / 100 / 12;
    for (let mes = 1; mes <= this.plazoMeses(); mes++) {
      const interesAcumulado = +(this.monto() * tasaMensual * mes).toFixed(2);
      puntos.push({
        mes,
        capitalAcumulado: this.monto(),
        interesAcumulado,
        total: +(this.monto() + interesAcumulado).toFixed(2)
      });
    }
    return puntos;
  });

  maxTotal = computed(() => Math.max(...this.proyeccion().map(p => p.total), 1));

  getBarraHeight(total: number): number {
    return Math.round((total / this.maxTotal()) * 100);
  }

  getInteresHeight(interes: number): number {
    return Math.round((interes / this.maxTotal()) * 100);
  }

  get simbolo(): string {
    return this.monedas.find(m => m.codigo === this.moneda())?.simbolo ?? 'S/.';
  }

  formatCurrency(amount: number): string {
    return `${this.simbolo} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  get tasaClase(): string {
    if (this.tasaAnual() >= 8) return 'tasa-alta';
    if (this.tasaAnual() >= 4) return 'tasa-media';
    return 'tasa-baja';
  }
}
