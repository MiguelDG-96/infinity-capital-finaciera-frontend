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
    ).subscribe(data => this._pagosEnRevision.set(data));
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
    this.fetchPagos().subscribe(data => this._pagosEnRevision.set(data));
  }

  private fetchPagos() {
    return this.http.get<PagoRevisionItem[]>(
      `${this.apiUrl}/creditos/admin/pagos-en-revision`
    ).pipe(
      catchError(() => of([] as PagoRevisionItem[]))
    );
  }
}
