// src/app/core/services/patrimonio.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActivoRequest,
  ActivoResponse,
  PasivoRequest,
  PasivoResponse,
  PatrimonioResponse
} from '../models/patrimonio.model';

@Injectable({
  providedIn: 'root'
})
export class PatrimonioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clientes`;

  // ── Patrimonio completo ────────────────────────────────────────────────

  /**
   * Obtiene el patrimonio completo de un cliente (activos + pasivos + totales).
   */
  obtenerPatrimonio(clienteId: number): Observable<PatrimonioResponse> {
    return this.http.get<PatrimonioResponse>(`${this.apiUrl}/${clienteId}/patrimonio`);
  }

  // ── Activos ────────────────────────────────────────────────────────────

  crearActivo(clienteId: number, activo: ActivoRequest): Observable<ActivoResponse> {
    return this.http.post<ActivoResponse>(`${this.apiUrl}/${clienteId}/activos`, activo);
  }

  actualizarActivo(clienteId: number, activoId: number, activo: ActivoRequest): Observable<ActivoResponse> {
    return this.http.put<ActivoResponse>(`${this.apiUrl}/${clienteId}/activos/${activoId}`, activo);
  }

  eliminarActivo(clienteId: number, activoId: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${clienteId}/activos/${activoId}`);
  }

  /**
   * Sube un documento de respaldo (imagen o PDF) para un activo.
   * Retorna la URL relativa del archivo.
   */
  subirDocumentoActivo(
    clienteId: number,
    activoId: number,
    archivo: File
  ): Observable<{ mensaje: string; url: string }> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<{ mensaje: string; url: string }>(
      `${this.apiUrl}/${clienteId}/activos/${activoId}/documento`,
      formData
    );
  }

  // ── Pasivos ────────────────────────────────────────────────────────────

  crearPasivo(clienteId: number, pasivo: PasivoRequest): Observable<PasivoResponse> {
    return this.http.post<PasivoResponse>(`${this.apiUrl}/${clienteId}/pasivos`, pasivo);
  }

  actualizarPasivo(clienteId: number, pasivoId: number, pasivo: PasivoRequest): Observable<PasivoResponse> {
    return this.http.put<PasivoResponse>(`${this.apiUrl}/${clienteId}/pasivos/${pasivoId}`, pasivo);
  }

  eliminarPasivo(clienteId: number, pasivoId: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${clienteId}/pasivos/${pasivoId}`);
  }

  /**
   * Sube un documento de respaldo (imagen o PDF) para un pasivo.
   * Retorna la URL relativa del archivo.
   */
  subirDocumentoPasivo(
    clienteId: number,
    pasivoId: number,
    archivo: File
  ): Observable<{ mensaje: string; url: string }> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<{ mensaje: string; url: string }>(
      `${this.apiUrl}/${clienteId}/pasivos/${pasivoId}/documento`,
      formData
    );
  }

  // ── Utilidades ─────────────────────────────────────────────────────────

  /**
   * Construye la URL completa de un archivo de respaldo.
   * Ejemplo: /uploads/user-12345678/Patrimonio/123456_activo_1.pdf
   *       → https://servicio.infiny-capital.com/uploads/user-12345678/...
   */
  buildDocUrl(relativeUrl: string | undefined | null): string | null {
    if (!relativeUrl) return null;
    const base = environment.apiUrl.replace('/api/v1', '');
    return `${base}${relativeUrl}`;
  }
}
