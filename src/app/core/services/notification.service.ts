// src/app/core/services/notification.service.ts
import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { interval, Subscription, forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  tipo: string;
  mensaje: string;
  monto?: number;
  moneda?: string;
  fecha: Date;
  leida: boolean;
  prospectoId?: number; // Para navegar al detalle del prospecto
}

export interface PagoRevisionItem {
  cuotaId: number;
  creditoId: number;
  numeroCuota: number;
  nombreCliente: string;
  dniCliente: string;
  montoPagadoCliente: number;
  metodoPago: string;
  numeroComprobante: string;
  imagenComprobante?: string;
}

export interface RetiroPendienteItem {
  id: number;
  monto: number;
  estado: string;
  fechaSolicitud: string;
  nombreCliente: string;
  documentoCliente: string;
  banco: string;
  numeroCuenta: string;
}

export interface PendienteCobranzaItem {
  creditoId: number;
  clienteNombre: string;
  clienteDocumento: string;
  clienteEmail: string;
  diasAtraso: number;
  nivel: number;
  cuotaAtrasadaId: number;
}

export interface SolicitudPendienteItem {
  creditoId: number;
  nombreCliente: string;
  tipoDocumento: string;
  numeroDocumento: string;
  montoSolicitado: number;
  monedaNombre: string;
  tipoCreditoNombre: string;
  fechaSolicitud: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly apiUrl = environment.apiUrl.replace(/\/$/, '');

  private _isOpen = signal(false);
  private _pagosEnRevision = signal<PagoRevisionItem[]>([]);
  private _retirosPendientes = signal<RetiroPendienteItem[]>([]);
  private _pendientesCobranza = signal<PendienteCobranzaItem[]>([]);
  private _solicitudesPendientes = signal<SolicitudPendienteItem[]>([]);
  private pollingSubscription: Subscription | null = null;

  // ── Notificaciones en tiempo real via polling (reemplaza WebSocket) ──
  private _realtimeNotifications = signal<AppNotification[]>([]);
  private _lastProspectosCount = -1; // -1 = primera carga, no notificar
  private prospectoPollingSubscription: Subscription | null = null;

  readonly isOpen = this._isOpen.asReadonly();
  readonly pagosEnRevision = this._pagosEnRevision.asReadonly();
  readonly retirosPendientes = this._retirosPendientes.asReadonly();
  readonly pendientesCobranza = this._pendientesCobranza.asReadonly();
  readonly solicitudesPendientes = this._solicitudesPendientes.asReadonly();
  readonly realtimeNotifications = this._realtimeNotifications.asReadonly();
  readonly totalNotificaciones = computed(() =>
    this._pagosEnRevision().length +
    this._retirosPendientes().length +
    this._pendientesCobranza().length +
    this._solicitudesPendientes().length +
    this._realtimeNotifications().filter(n => !n.leida).length
  );

  open() { this._isOpen.set(true); }
  close() { this._isOpen.set(false); }
  toggle() { this._isOpen.update(v => !v); }

  /**
   * Inicia el polling. Se puede llamar múltiples veces — solo arranca una vez.
   * No verifica el rol aquí: la API devuelve [] si el usuario no tiene permisos.
   */
  iniciarPolling() {
    if (this.pollingSubscription) return;

    // Primera carga inmediata
    this.fetchAndUpdate();

    // Luego cada 180 segundos (3 minutos) para no saturar el servidor
    this.pollingSubscription = interval(180_000).pipe(
      switchMap(() => forkJoin({
        pagos: this.fetchPagos(),
        retiros: this.fetchRetiros(),
        cobranzas: this.fetchCobranzas(),
        solicitudes: this.fetchSolicitudes()
      }))
    ).subscribe(({ pagos, retiros, cobranzas, solicitudes }) => {
      this.verificarYNotificar(pagos, retiros, cobranzas, solicitudes);
      this._pagosEnRevision.set(pagos);
      this._retirosPendientes.set(retiros);
      this._pendientesCobranza.set(cobranzas);
      this._solicitudesPendientes.set(solicitudes);
    });
  }

  detenerPolling() {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
    this.prospectoPollingSubscription?.unsubscribe();
    this.prospectoPollingSubscription = null;
    // NO limpiamos _realtimeNotifications ni _lastProspectosCount aquí.
    // Esas son persistentes durante toda la sesión del usuario.
    this._pagosEnRevision.set([]);
    this._retirosPendientes.set([]);
    this._pendientesCobranza.set([]);
    this._solicitudesPendientes.set([]);
  }

  /**
   * Inicia un polling de 30s que detecta nuevos prospectos de inversión.
   * Cuando el número crece respecto a la última consulta, dispara una notificación visible.
   * Funciona sin WebSocket ni configuración de NGINX.
   */
  iniciarPollingProspectos() {
    if (this.prospectoPollingSubscription) return;

    // Carga inicial silenciosa (establecer baseline)
    this.checkProspectos(true);

    this.prospectoPollingSubscription = interval(30_000).subscribe(() => {
      this.checkProspectos(false);
    });
  }

  // IDs de prospectos ya notificados — evita duplicados si el orden del API cambia
  private _notifiedProspectoIds = new Set<number>();

  private checkProspectos(silencioso: boolean) {
    this.http.get<any[]>(`${this.apiUrl}/inversionistas-prospectos`).pipe(
      catchError(() => of([] as any[]))
    ).subscribe(prospectos => {
      const count = prospectos.length;

      if (!silencioso && this._lastProspectosCount >= 0 && count > this._lastProspectosCount) {
        // Los nuevos están al FINAL del array (los más recientes tienen ID más alto)
        const diff = count - this._lastProspectosCount;
        const nuevos = prospectos.slice(-diff); // ← slice del final, no del inicio

        nuevos.forEach((p: any) => {
          // Evitar notificar dos veces al mismo prospecto
          if (this._notifiedProspectoIds.has(p.id)) return;
          this._notifiedProspectoIds.add(p.id);

          const notif: AppNotification = {
            id: Math.random().toString(36).substring(2, 9),
            tipo: 'NUEVO_PROSPECTO',
            mensaje: `Nuevo prospecto: ${p.nombres} ${p.apellidoPaterno} — S/ ${p.montoInversion?.toLocaleString('es-PE') ?? '?'}`,
            monto: p.montoInversion,
            moneda: 'S/.',
            fecha: new Date(),
            leida: false,
            prospectoId: p.id
          };
          this._realtimeNotifications.update(prev => [notif, ...prev].slice(0, 50));
        });
        this.playNotificationSound();
      } else if (silencioso) {
        // En la carga silenciosa inicial, registrar todos los IDs conocidos
        prospectos.forEach((p: any) => this._notifiedProspectoIds.add(p.id));
      }

      this._lastProspectosCount = count;
    });

  }

  marcarRealtimeLeida(id: string) {
    this._realtimeNotifications.update(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
  }

  limpiarRealtimeNotifications() {
    this._realtimeNotifications.set([]);
  }

  recargar() {
    this.fetchAndUpdate();
  }

  irAlCredito(creditoId: number) {
    this.close();
    this.router.navigate(['/dashboard/admin/cartera', creditoId]);
  }

  irAlProspecto(prospectoId: number) {
    this.close();
    this.router.navigate(['/dashboard/admin/inversionistas'], {
      queryParams: { detalle: prospectoId }
    });
  }

  irATesoreria() {
    this.close();
    this.router.navigate(['/dashboard/admin/tesoreria']);
  }

  irASolicitudes() {
    this.close();
    this.router.navigate(['/dashboard/admin/solicitudes']);
  }

  private fetchAndUpdate() {
    forkJoin({
      pagos: this.fetchPagos(),
      retiros: this.fetchRetiros(),
      cobranzas: this.fetchCobranzas(),
      solicitudes: this.fetchSolicitudes()
    }).subscribe(({ pagos, retiros, cobranzas, solicitudes }) => {
      this.verificarYNotificar(pagos, retiros, cobranzas, solicitudes);
      this._pagosEnRevision.set(pagos);
      this._retirosPendientes.set(retiros);
      this._pendientesCobranza.set(cobranzas);
      this._solicitudesPendientes.set(solicitudes);
    });
  }

  private verificarYNotificar(newPagos: PagoRevisionItem[], newRetiros: RetiroPendienteItem[], newCobranzas: PendienteCobranzaItem[], newSolicitudes: SolicitudPendienteItem[]) {
    const currentTotalLength = this._pagosEnRevision().length + this._retirosPendientes().length + this._pendientesCobranza().length + this._solicitudesPendientes().length;
    const newTotalLength = newPagos.length + newRetiros.length + newCobranzas.length + newSolicitudes.length;
    
    // Reproducir sonido solo si hay nuevas notificaciones (más de las que ya teníamos)
    if (newTotalLength > currentTotalLength && currentTotalLength >= 0) {
      this.playNotificationSound();
    }
  }

  // AudioContext cacheado — se inicializa en el primer gesto del usuario
  private audioCtx: AudioContext | null = null;

  /**
   * Debe llamarse desde un evento de usuario (click) para desbloquear el audio.
   * Llamar desde el botón de la campanita.
   */
  initAudio() {
    if (this.audioCtx) {
      // Si estaba suspendido (tab inactiva), lo reanudamos
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return;
    }
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.audioCtx = new AudioContextClass();
    }
  }

  private playNotificationSound() {
    try {
      if (!this.audioCtx || this.audioCtx.state === 'closed') return;
      if (this.audioCtx.state === 'suspended') {
        // No podemos reproducir sin gesto — omitimos silenciosamente
        return;
      }
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Campanita: A5 → A6 rápido, fade out suave
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  private fetchPagos() {
    return this.http.get<PagoRevisionItem[]>(
      `${this.apiUrl}/creditos/admin/pagos-en-revision`
    ).pipe(
      catchError(() => of([] as PagoRevisionItem[]))
    );
  }

  private fetchRetiros() {
    return this.http.get<RetiroPendienteItem[]>(
      `${this.apiUrl}/tesoreria/retiros-pendientes`
    ).pipe(
      catchError(() => of([] as RetiroPendienteItem[]))
    );
  }

  private fetchCobranzas() {
    return this.http.get<PendienteCobranzaItem[]>(
      `${this.apiUrl}/creditos/admin/pendientes-cobranza`
    ).pipe(
      catchError(() => of([] as PendienteCobranzaItem[]))
    );
  }

  private fetchSolicitudes() {
    return this.http.get<SolicitudPendienteItem[]>(
      `${this.apiUrl}/creditos/solicitudes-pendientes`
    ).pipe(
      catchError(() => of([] as SolicitudPendienteItem[]))
    );
  }
}
