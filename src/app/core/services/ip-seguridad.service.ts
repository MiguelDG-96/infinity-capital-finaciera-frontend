import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IpListaBlanca {
  id: number;
  ipDireccion: string;
  aliasOficina: string;
  notas: string;
  adminRegistro: string;
  fechaRegistro: string;
}

export interface IpListaNegra {
  id: number;
  ipDireccion: string;
  motivo: string;
  totalIntentos: number;
  fechaBloqueo: string;
  desbloqueadaPor?: string;
  fechaDesbloqueo?: string;
}

export interface HistorialConexion {
  ip: string;
  tipo: 'EXITOSO' | 'FALLIDO';
  usuario: string;
  nombreCompleto: string;
  dispositivo: string;
  totalFallos?: number;
  fechaUltimaConexion: string;
  enListaBlanca: boolean;
  enListaNegra: boolean;
  alias?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IpSeguridadService {
  private apiUrl = `${environment.apiUrl}/seguridad/ips`;

  constructor(private http: HttpClient) {}

  // --- Lista Blanca ---
  obtenerListaBlanca(): Observable<IpListaBlanca[]> {
    return this.http.get<IpListaBlanca[]>(`${this.apiUrl}/lista-blanca`);
  }

  agregarAListaBlanca(ip: string, alias: string, notas: string): Observable<IpListaBlanca> {
    return this.http.post<IpListaBlanca>(`${this.apiUrl}/lista-blanca`, { ip, alias, notas });
  }

  eliminarDeListaBlanca(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lista-blanca/${id}`);
  }

  // --- Lista Negra ---
  obtenerListaNegra(): Observable<IpListaNegra[]> {
    return this.http.get<IpListaNegra[]>(`${this.apiUrl}/lista-negra`);
  }

  agregarAListaNegra(ip: string, motivo: string): Observable<IpListaNegra> {
    return this.http.post<IpListaNegra>(`${this.apiUrl}/lista-negra`, { ip, motivo });
  }

  desbloquearIp(ip: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/desbloquear/${ip}`);
  }

  // --- Historial ---
  obtenerHistorial(): Observable<HistorialConexion[]> {
    return this.http.get<HistorialConexion[]>(`${this.apiUrl}/historial`);
  }
}
