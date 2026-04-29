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
}

export interface ProcesarRetiroRequest {
  numeroOperacion: string;
  aprobado: boolean;
  motivoRechazo?: string;
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

  procesarRetiro(id: number, request: ProcesarRetiroRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/retiros/${id}/procesar`, request);
  }
}
