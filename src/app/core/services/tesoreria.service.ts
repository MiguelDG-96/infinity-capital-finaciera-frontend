import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SolicitudRetiroTesoreria {
  id: number;
  nombreCliente: string;
  documentoCliente: string;
  monto: number;
  banco: string;
  numeroCuenta: string;
  cci: string;
  estado: string;
  fechaSolicitud: string;
  fechaProcesamiento?: string;
  numeroOperacion?: string;
  comprobanteUrl?: string;
}

export interface ProcesarRetiroRequest {
  numeroOperacion: string;
  aprobado: boolean;
  motivoRechazo?: string;
}

export interface DesembolsoPendiente {
  creditoId: number;
  nombreCliente: string;
  documentoCliente: string;
  montoADesembolsar: number;
  moneda: string;
  tipoCredito: string;
  fechaAprobacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class TesoreriaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tesoreria`;

  obtenerRetirosPendientes(): Observable<SolicitudRetiroTesoreria[]> {
    return this.http.get<SolicitudRetiroTesoreria[]>(`${this.apiUrl}/retiros-pendientes`);
  }

  obtenerHistorialRetiros(): Observable<SolicitudRetiroTesoreria[]> {
    return this.http.get<SolicitudRetiroTesoreria[]>(`${this.apiUrl}/historial-retiros`);
  }

  obtenerDesembolsosPendientes(): Observable<DesembolsoPendiente[]> {
    return this.http.get<DesembolsoPendiente[]>(`${this.apiUrl}/desembolsos-pendientes`);
  }

  procesarRetiro(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/retiros/${id}/procesar`, formData);
  }

  procesarDesembolso(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/desembolsos/${id}/procesar`, {});
  }
}
