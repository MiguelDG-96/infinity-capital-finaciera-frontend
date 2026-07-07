// src/app/core/services/notification.service.ts
import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { interval, Subscription, forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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

  readonly isOpen = this._isOpen.asReadonly();
  readonly pagosEnRevision = this._pagosEnRevision.asReadonly();
  readonly retirosPendientes = this._retirosPendientes.asReadonly();
  readonly pendientesCobranza = this._pendientesCobranza.asReadonly();
  readonly solicitudesPendientes = this._solicitudesPendientes.asReadonly();
  readonly totalNotificaciones = computed(() => this._pagosEnRevision().length + this._retirosPendientes().length + this._pendientesCobranza().length + this._solicitudesPendientes().length);

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

    // Luego cada 60 segundos
    this.pollingSubscription = interval(60_000).pipe(
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
    this._pagosEnRevision.set([]);
    this._retirosPendientes.set([]);
    this._pendientesCobranza.set([]);
    this._solicitudesPendientes.set([]);
  }

  recargar() {
    this.fetchAndUpdate();
  }

  irAlCredito(creditoId: number) {
    this.close();
    this.router.navigate(['/dashboard/admin/cartera', creditoId]);
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

  private playNotificationSound() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Sonido tipo "campanita" / "ding"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Nota A5
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // Sube rápido a A6
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
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
