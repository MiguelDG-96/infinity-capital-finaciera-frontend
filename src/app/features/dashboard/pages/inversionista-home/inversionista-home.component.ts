import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { InversionService } from '../../../../core/services/inversion.service';
import { AuthService } from '../../../../core/services/auth.service';
import { InversionResponse, ResumenInversionistaResponse } from '../../../../core/models/inversion.model';

@Component({
  selector: 'app-inversionista-home',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './inversionista-home.component.html',
  styleUrl: './inversionista-home.component.css',
})
export class InversionistaHomeComponent implements OnInit {
  private inversionService = inject(InversionService);
  private authService     = inject(AuthService);

  userData   = this.authService.currentUserData;
  resumen    = signal<ResumenInversionistaResponse | null>(null);
  inversiones = signal<InversionResponse[]>([]);
  cargando   = signal(true);
  error      = signal<string | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      resumen: this.inversionService.getResumen(),
      inversiones: this.inversionService.getMisInversiones()
    }).subscribe({
      next: ({ resumen, inversiones }) => {
        this.resumen.set(resumen);
        // Solo las últimas 3 para el home
        this.inversiones.set(inversiones.slice(0, 3));
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la información. Intente de nuevo.');
        this.cargando.set(false);
      }
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'ACTIVA':    return 'badge-activa';
      case 'VENCIDA':   return 'badge-vencida';
      case 'LIQUIDADA': return 'badge-liquidada';
      case 'CANCELADA': return 'badge-cancelada';
      default:          return '';
    }
  }

  formatCurrency(amount: number, moneda = 'PEN'): string {
    const symbol = moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : 'S/.';
    return `${symbol} ${amount?.toFixed(2) ?? '0.00'}`;
  }

  getDiasLabel(dias: number): string {
    if (dias < 0)  return `Venció hace ${Math.abs(dias)} días`;
    if (dias === 0) return 'Vence hoy';
    return `${dias} días restantes`;
  }

  getDiasClass(dias: number): string {
    if (dias < 0)   return 'dias-vencido';
    if (dias <= 30) return 'dias-critico';
    if (dias <= 90) return 'dias-alerta';
    return 'dias-ok';
  }
}
