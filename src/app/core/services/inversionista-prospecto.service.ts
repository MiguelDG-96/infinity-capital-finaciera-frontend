import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InversionistaProspecto {
  id?: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  dni: string;
  email: string;
  telefono: string;
  montoInversion: number;
  plazo: string;
  estado?: string;
  fechaCreacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InversionistaProspectoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/inversionistas-prospectos`;

  // Public endpoint
  crearProspecto(prospecto: InversionistaProspecto): Observable<InversionistaProspecto> {
    return this.http.post<InversionistaProspecto>(this.apiUrl, prospecto);
  }

  // Admin endpoints
  listarProspectos(): Observable<InversionistaProspecto[]> {
    return this.http.get<InversionistaProspecto[]>(this.apiUrl);
  }

  actualizarEstado(id: number, estado: string): Observable<InversionistaProspecto> {
    return this.http.put<InversionistaProspecto>(`${this.apiUrl}/${id}/estado?estado=${estado}`, {});
  }
}
