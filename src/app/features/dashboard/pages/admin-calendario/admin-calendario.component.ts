import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CreditoService } from '../../../../core/services/credito.service';
import { Cuota, Credito } from '../../../../core/models/credito.model';

export interface CuotaCalendario {
  cuotaId: number;
  creditoId: number;
  numeroCuota: number;
  clienteNombre: string;
  clienteDocumento: string;
  monto: number;
  estadoCuota: string;
  fechaVencimiento: Date;
}

@Component({
  selector: 'app-admin-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-calendario.component.html',
})
export class AdminCalendarioComponent implements OnInit {
  private creditoService = inject(CreditoService);
  private router = inject(Router);

  // ── Estado de carga ──────────────────────────────────────────────────
  cargando = signal(true);
  error = signal<string | null>(null);

  // ── Navegación del calendario ────────────────────────────────────────
  readonly hoy = new Date();
  mesActual = signal(this.hoy.getMonth());      // 0-11
  anioActual = signal(this.hoy.getFullYear());

  // ── Datos ─────────────────────────────────────────────────────────────
  readonly Math = Math;
  
  /** Todas las cuotas de toda la cartera, aplanadas y filtradas */
  todasLasCuotas = signal<CuotaCalendario[]>([]);

  /** Día seleccionado para el panel lateral */
  diaSeleccionado = signal<string | null>(null); // formato YYYY-MM-DD

  // ── Computed: mapa fecha → cuotas ────────────────────────────────────
  readonly cuotasPorFecha = computed<Map<string, CuotaCalendario[]>>(() => {
    const map = new Map<string, CuotaCalendario[]>();
    for (const c of this.todasLasCuotas()) {
      const key = this.toKey(c.fechaVencimiento);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  });

  // ── Computed: grid del mes ────────────────────────────────────────────
  readonly diasDelMes = computed<(number | null)[]>(() => {
    const mes = this.mesActual();
    const anio = this.anioActual();
    const primerDia = new Date(anio, mes, 1).getDay(); // 0=Dom
    // Convertir a Lunes=0 ... Domingo=6
    const offset = (primerDia === 0) ? 6 : primerDia - 1;
    const totalDias = new Date(anio, mes + 1, 0).getDate();
    const grid: (number | null)[] = [];
    for (let i = 0; i < offset; i++) grid.push(null);
    for (let d = 1; d <= totalDias; d++) grid.push(d);
    // Completar hasta múltiplo de 7
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  });

  // ── Computed: cuotas del día seleccionado ────────────────────────────
  readonly cuotasDiaSeleccionado = computed<CuotaCalendario[]>(() => {
    const dia = this.diaSeleccionado();
    if (!dia) return [];
    return this.cuotasPorFecha().get(dia) || [];
  });

  readonly totalMontoDiaSeleccionado = computed<number>(() => {
    return this.cuotasDiaSeleccionado().reduce((sum, c) => sum + c.monto, 0);
  });

  // ── Computed: totales del mes para el resumen ────────────────────────
  readonly resumenMes = computed(() => {
    const mes = this.mesActual();
    const anio = this.anioActual();
    const cuotas = this.todasLasCuotas().filter(c => {
      const fv = new Date(c.fechaVencimiento);
      return fv.getMonth() === mes && fv.getFullYear() === anio;
    });
    return {
      total: cuotas.length,
      vencidas: cuotas.filter(c => this.estaVencida(c)).length,
      pendientes: cuotas.filter(c => c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'PAGADO_PARCIAL').length,
      pagadas: cuotas.filter(c => c.estadoCuota === 'PAGADO').length,
      montoPendiente: cuotas
        .filter(c => c.estadoCuota !== 'PAGADO')
        .reduce((sum, c) => sum + c.monto, 0),
    };
  });

  readonly MESES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];
  readonly DIAS_SEMANA = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

  ngOnInit() {
    this.cargarCartera();
  }

  cargarCartera() {
    this.cargando.set(true);
    this.error.set(null);
    this.creditoService.obtenerCarteraGeneral().subscribe({
      next: (creditos) => {
        const cuotas: CuotaCalendario[] = [];
        const estadosCredito = ['ACTIVO', 'MORA', 'ATRASADO'];

        for (const credito of creditos) {
          if (!estadosCredito.includes(credito.estado)) continue;
          const nombre = credito.cliente?.usuario?.nombreCompleto
            || credito.nombreCliente
            || 'Cliente';
          const documento = credito.cliente?.numeroDocumento
            || credito.documento
            || '';

          for (const cuota of (credito.cuotas || [])) {
            if (!cuota.fechaVencimiento) continue;
            cuotas.push({
              cuotaId: cuota.id,
              creditoId: credito.id,
              numeroCuota: cuota.numeroCuota,
              clienteNombre: nombre,
              clienteDocumento: documento,
              monto: cuota.totalCuota || 0,
              estadoCuota: cuota.estadoCuota,
              fechaVencimiento: new Date(cuota.fechaVencimiento),
            });
          }
        }
        this.todasLasCuotas.set(cuotas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar la cartera de créditos.');
        this.cargando.set(false);
      }
    });
  }

  // ── Navegación ────────────────────────────────────────────────────────
  mesAnterior() {
    const m = this.mesActual();
    if (m === 0) { this.mesActual.set(11); this.anioActual.update(a => a - 1); }
    else { this.mesActual.update(v => v - 1); }
    this.diaSeleccionado.set(null);
  }

  mesSiguiente() {
    const m = this.mesActual();
    if (m === 11) { this.mesActual.set(0); this.anioActual.update(a => a + 1); }
    else { this.mesActual.update(v => v + 1); }
    this.diaSeleccionado.set(null);
  }

  irAHoy() {
    this.mesActual.set(this.hoy.getMonth());
    this.anioActual.set(this.hoy.getFullYear());
    this.diaSeleccionado.set(this.toKey(this.hoy));
  }

  seleccionarDia(dia: number | null) {
    if (!dia) return;
    const key = `${this.anioActual()}-${String(this.mesActual() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    this.diaSeleccionado.set(this.diaSeleccionado() === key ? null : key);
  }

  cerrarPanel() {
    this.diaSeleccionado.set(null);
  }

  irAlCredito(creditoId: number) {
    this.router.navigate(['/dashboard/admin/cartera', creditoId]);
  }

  // ── Helpers de UI ─────────────────────────────────────────────────────
  toKey(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  keyParaDia(dia: number): string {
    return `${this.anioActual()}-${String(this.mesActual() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  esHoy(dia: number): boolean {
    return this.keyParaDia(dia) === this.toKey(this.hoy);
  }

  esSeleccionado(dia: number): boolean {
    return this.keyParaDia(dia) === this.diaSeleccionado();
  }

  getCuotasDia(dia: number): CuotaCalendario[] {
    return this.cuotasPorFecha().get(this.keyParaDia(dia)) || [];
  }

  estaVencida(c: CuotaCalendario): boolean {
    return c.estadoCuota === 'MORA' ||
      ((c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'PAGADO_PARCIAL') &&
        new Date(c.fechaVencimiento) < this.hoy);
  }

  /** Color del badge del día según el peor estado de sus cuotas */
  getColorDia(dia: number): 'vencida' | 'hoy' | 'futura' | 'pagada' | 'mixta' | 'none' {
    const cuotas = this.getCuotasDia(dia);
    if (cuotas.length === 0) return 'none';
    const tieneVencida = cuotas.some(c => this.estaVencida(c));
    const tieneHoy = this.esHoy(dia);
    const todasPagadas = cuotas.every(c => c.estadoCuota === 'PAGADO');
    if (todasPagadas) return 'pagada';
    if (tieneVencida && !tieneHoy) return 'vencida';
    if (tieneHoy) return 'hoy';
    return 'futura';
  }

  getBadgeClass(color: 'vencida' | 'hoy' | 'futura' | 'pagada' | 'mixta' | 'none'): string {
    const map: Record<string, string> = {
      vencida: 'bg-error text-error-content',
      hoy:     'bg-warning text-warning-content',
      futura:  'bg-info text-info-content',
      pagada:  'bg-success text-success-content',
      mixta:   'bg-secondary text-secondary-content',
      none:    '',
    };
    return map[color] || '';
  }

  getEstadoBadge(estado: string): string {
    const map: Record<string, string> = {
      'PAGADO':        'badge-success',
      'MORA':          'badge-error',
      'PENDIENTE':     'badge-ghost',
      'PAGADO_PARCIAL':'badge-warning',
      'REVISION':      'badge-info',
    };
    return map[estado] || 'badge-ghost';
  }

  formatMonto(monto: number): string {
    return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(monto);
  }

  getDiaLabel(key: string): string {
    const [anio, mes, dia] = key.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    return fecha.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  getAniosDisponibles(): number[] {
    const base = this.hoy.getFullYear();
    return [base - 2, base - 1, base, base + 1, base + 2];
  }
}
