// src/app/core/services/notification.service.ts
import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly apiUrl = environment.apiUrl.replace(/\/$/, '');

  private _isOpen = signal(false);
  private _pagosEnRevision = signal<PagoRevisionItem[]>([]);
  private pollingSubscription: Subscription | null = null;

  readonly isOpen = this._isOpen.asReadonly();
  readonly pagosEnRevision = this._pagosEnRevision.asReadonly();
  readonly totalNotificaciones = computed(() => this._pagosEnRevision().length);

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
      switchMap(() => this.fetchPagos())
    ).subscribe(data => {
      this.verificarYNotificar(data);
      this._pagosEnRevision.set(data);
    });
  }

  detenerPolling() {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
    this._pagosEnRevision.set([]);
  }

  recargar() {
    this.fetchAndUpdate();
  }

  irAlCredito(creditoId: number) {
    this.close();
    this.router.navigate(['/dashboard/admin/cartera', creditoId]);
  }

  private fetchAndUpdate() {
    this.fetchPagos().subscribe(data => {
      this.verificarYNotificar(data);
      this._pagosEnRevision.set(data);
    });
  }

  private verificarYNotificar(newData: PagoRevisionItem[]) {
    const currentLength = this._pagosEnRevision().length;
    // Reproducir sonido solo si hay nuevas notificaciones (más de las que ya teníamos)
    if (newData.length > currentLength && currentLength >= 0) {
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
}
