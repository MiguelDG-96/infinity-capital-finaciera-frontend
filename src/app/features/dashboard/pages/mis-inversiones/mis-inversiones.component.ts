import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { InversionService } from '../../../../core/services/inversion.service';
import { InversionResponse } from '../../../../core/models/inversion.model';

type FiltroEstado = 'TODOS' | 'ACTIVA' | 'VENCIDA' | 'LIQUIDADA';

@Component({
  selector: 'app-mis-inversiones',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './mis-inversiones.component.html',
  styleUrl: './mis-inversiones.component.css',
})
export class MisInversionesComponent implements OnInit {
  private inversionService = inject(InversionService);

  inversiones   = signal<InversionResponse[]>([]);
  cargando      = signal(true);
  error         = signal<string | null>(null);
  filtroActivo  = signal<FiltroEstado>('TODOS');

  filtros: FiltroEstado[] = ['TODOS', 'ACTIVA', 'VENCIDA', 'LIQUIDADA'];

  inversionesFiltradas = computed(() => {
    const filtro = this.filtroActivo();
    if (filtro === 'TODOS') return this.inversiones();
    return this.inversiones().filter(i => i.estado === filtro);
  });

  ngOnInit() {
    this.cargarInversiones();
  }

  cargarInversiones() {
    this.cargando.set(true);
    this.error.set(null);
    this.inversionService.getMisInversiones().subscribe({
      next: (data) => {
        this.inversiones.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las inversiones.');
        this.cargando.set(false);
      }
    });
  }

  setFiltro(filtro: FiltroEstado) {
    this.filtroActivo.set(filtro);
  }

  formatCurrency(amount: number, moneda = 'PEN'): string {
    const symbol = moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : 'S/.';
    return `${symbol} ${(amount ?? 0).toFixed(2)}`;
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      ACTIVA: 'badge-activa', VENCIDA: 'badge-vencida',
      LIQUIDADA: 'badge-liquidada', CANCELADA: 'badge-cancelada'
    };
    return map[estado] ?? '';
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
