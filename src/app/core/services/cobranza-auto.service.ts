import { Injectable, inject, signal, computed } from '@angular/core';
import { NotificationService, PendienteCobranzaItem } from './notification.service';
import { CreditoService } from './credito.service';
import { CartaCobranzaPdfService } from './carta-cobranza-pdf.service';
import { firstValueFrom } from 'rxjs';

export type CobranzaEstado = 'idle' | 'confirmando' | 'enviando' | 'completado' | 'minimizado';

export interface NivelProgress {
  nivel: number;
  label: string;
  total: number;
  actual: number;
  exitos: number;
  fallos: number;
  completado: boolean;
  activo: boolean;
}

export interface CobranzaAutoState {
  estado: CobranzaEstado;
  niveles: NivelProgress[];
  logActual: string;
  iniciadoEn: Date | null;
}

@Injectable({ providedIn: 'root' })
export class CobranzaAutoService {
  private notificationService = inject(NotificationService);
  private creditoService = inject(CreditoService);
  private pdfService = inject(CartaCobranzaPdfService);

  readonly state = signal<CobranzaAutoState>({
    estado: 'idle',
    niveles: [],
    logActual: '',
    iniciadoEn: null
  });

  readonly isVisible = computed(() =>
    ['confirmando', 'enviando', 'completado', 'minimizado'].includes(this.state().estado)
  );

  readonly isMinimized = computed(() => this.state().estado === 'minimizado');

  readonly totalExitos = computed(() =>
    this.state().niveles.reduce((s, n) => s + n.exitos, 0)
  );

  readonly totalFallos = computed(() =>
    this.state().niveles.reduce((s, n) => s + n.fallos, 0)
  );

  readonly porcentajeGlobal = computed(() => {
    const niveles = this.state().niveles;
    if (!niveles.length) return 0;
    const total = niveles.reduce((s, n) => s + n.total, 0);
    const actual = niveles.reduce((s, n) => s + n.actual, 0);
    return total > 0 ? Math.round((actual / total) * 100) : 0;
  });

  readonly nivelActivo = computed(() =>
    this.state().niveles.find(n => n.activo) ?? null
  );

  readonly todosCompletados = computed(() =>
    this.state().niveles.length > 0 && this.state().niveles.every(n => n.completado)
  );

  /** Llamar al login si el usuario es trabajador/admin y hay pendientes */
  mostrarConfirmacion() {
    const pendientes = this.notificationService.pendientesCobranza();
    if (pendientes.length === 0) return;

    const porNivel = this.buildNiveles(pendientes);
    if (porNivel.every(n => n.total === 0)) return;

    this.state.set({
      estado: 'confirmando',
      niveles: porNivel,
      logActual: '',
      iniciadoEn: null
    });
  }

  confirmar() {
    this.state.update(s => ({ ...s, estado: 'enviando', iniciadoEn: new Date() }));
    this.iniciarEnvioSecuencial();
  }

  cancelar() {
    this.state.update(s => ({ ...s, estado: 'idle' }));
  }

  minimizar() {
    if (this.state().estado === 'enviando' || this.state().estado === 'completado') {
      this.state.update(s => ({ ...s, estado: 'minimizado' }));
    }
  }

  expandir() {
    const prevEstado = this.todosCompletados() ? 'completado' : 'enviando';
    this.state.update(s => ({ ...s, estado: prevEstado }));
  }

  cerrar() {
    this.state.set({ estado: 'idle', niveles: [], logActual: '', iniciadoEn: null });
    this.notificationService.recargar();
  }

  private buildNiveles(pendientes: PendienteCobranzaItem[]): NivelProgress[] {
    return [1, 2, 3].map(nivel => ({
      nivel,
      label: nivel === 1 ? 'Nivel 1 (1-30 días)' : nivel === 2 ? 'Nivel 2 (31-60 días)' : 'Nivel 3 (>60 días)',
      total: pendientes.filter(p => p.nivel === nivel).length,
      actual: 0,
      exitos: 0,
      fallos: 0,
      completado: false,
      activo: false
    }));
  }

  private async iniciarEnvioSecuencial() {
    const pendientes = this.notificationService.pendientesCobranza();

    for (let nivelIdx = 0; nivelIdx < 3; nivelIdx++) {
      const nivel = nivelIdx + 1;
      const items = pendientes.filter(p => p.nivel === nivel);
      if (items.length === 0) {
        // Marcar como completado vacío inmediatamente
        this.state.update(s => ({
          ...s,
          niveles: s.niveles.map(n => n.nivel === nivel ? { ...n, completado: true, activo: false } : n)
        }));
        continue;
      }

      // Activar este nivel
      this.state.update(s => ({
        ...s,
        niveles: s.niveles.map(n => ({
          ...n,
          activo: n.nivel === nivel,
          completado: n.completado || false
        }))
      }));

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        this.state.update(s => ({
          ...s,
          logActual: `Enviando carta a ${item.clienteNombre}...`,
          niveles: s.niveles.map(n => n.nivel === nivel ? { ...n, actual: i + 1 } : n)
        }));

        try {
          const credito = await firstValueFrom(this.creditoService.obtenerCreditoPorIdAdmin(item.creditoId));
          const cuotas = await firstValueFrom(this.creditoService.obtenerCronogramaAdmin(item.creditoId));
          const pdfBlob = await this.pdfService.generarCarta(credito, cuotas, nivel, false);
          const email = item.clienteEmail || 'noreply@infinitycapital.com';
          await firstValueFrom(this.creditoService.enviarCartaCobranza(item.creditoId, pdfBlob, email, item.clienteNombre, nivel));

          this.state.update(s => ({
            ...s,
            niveles: s.niveles.map(n => n.nivel === nivel ? { ...n, exitos: n.exitos + 1 } : n)
          }));
        } catch {
          this.state.update(s => ({
            ...s,
            niveles: s.niveles.map(n => n.nivel === nivel ? { ...n, fallos: n.fallos + 1 } : n)
          }));
        }
      }

      // Marcar nivel como completado
      this.state.update(s => ({
        ...s,
        logActual: `Nivel ${nivel} completado ✓`,
        niveles: s.niveles.map(n => n.nivel === nivel ? { ...n, completado: true, activo: false } : n)
      }));

      // Pausa breve antes de pasar al siguiente nivel
      await new Promise(r => setTimeout(r, 800));
    }

    this.state.update(s => ({ ...s, estado: 'completado', logActual: 'Todos los envíos completados ✓' }));
  }
}
