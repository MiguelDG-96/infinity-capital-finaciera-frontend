import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Router, RouterLink } from '@angular/router';
import { InversionService } from '../../../../core/services/inversion.service';
import { InversionRequest } from '../../../../core/models/inversion.model';

@Component({
  selector: 'app-solicitar-inversion',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  templateUrl: './solicitar-inversion.component.html',
  styleUrl: './solicitar-inversion.component.css',
})
export class SolicitarInversionComponent {
  private inversionService = inject(InversionService);
  private router = inject(Router);

  // Planes predefinidos
  planes = [
    { label: '6 Meses',  meses: 6,  tasa: 2.0,  descripcion: 'Plan Corto Plazo' },
    { label: '1 Año',    meses: 12, tasa: 3.0,  descripcion: 'Plan Estándar ⭐' },
    { label: '2 Años',   meses: 24, tasa: 4.5,  descripcion: 'Plan Largo Plazo' },
    { label: '3 Años',   meses: 36, tasa: 6.0,  descripcion: 'Plan Premium' },
  ];

  planSeleccionado = signal(1); // índice del plan (por defecto Plan Estándar)

  monto       = signal(5000);
  plazoMeses  = signal(12);
  tasaAnual   = signal(3.0);
  moneda      = signal('PEN');
  observaciones = signal('');

  monedas = [
    { codigo: 'PEN', simbolo: 'S/.' },
    { codigo: 'USD', simbolo: '$' },
    { codigo: 'EUR', simbolo: '€' },
  ];

  enviando  = signal(false);
  enviado   = signal(false);
  errorMsg  = signal<string | null>(null);

  // Cálculo en tiempo real
  interesProyectado = computed(() => {
    return +(this.monto() * (this.tasaAnual() / 100) * (this.plazoMeses() / 12)).toFixed(2);
  });

  montoFinal = computed(() => +(this.monto() + this.interesProyectado()).toFixed(2));

  fechaVencimiento = computed(() => {
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() + this.plazoMeses());
    return inicio.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  });

  get simbolo(): string {
    return this.monedas.find(m => m.codigo === this.moneda())?.simbolo ?? 'S/.';
  }

  seleccionarPlan(index: number) {
    const plan = this.planes[index];
    this.planSeleccionado.set(index);
    this.plazoMeses.set(plan.meses);
    this.tasaAnual.set(plan.tasa);
  }

  formatCurrency(amount: number): string {
    return `${this.simbolo} ${(amount ?? 0).toFixed(2)}`;
  }

  submitForm() {
    if (this.monto() < 100) {
      this.errorMsg.set('El monto mínimo de inversión es S/. 100.');
      return;
    }
    this.enviando.set(true);
    this.errorMsg.set(null);

    const request: InversionRequest = {
      monto: this.monto(),
      plazoMeses: this.plazoMeses(),
      tasaAnual: this.tasaAnual(),
      moneda: this.moneda(),
      observaciones: this.observaciones()
    };

    this.inversionService.crearInversion(request).subscribe({
      next: () => {
        this.enviando.set(false);
        this.enviado.set(true);
      },
      error: (err) => {
        this.enviando.set(false);
        this.errorMsg.set(err?.error?.mensaje ?? 'Error al registrar la inversión. Intente de nuevo.');
      }
    });
  }

  irAMisInversiones() {
    this.router.navigate(['/dashboard/inversiones/mis-inversiones']);
  }
}
