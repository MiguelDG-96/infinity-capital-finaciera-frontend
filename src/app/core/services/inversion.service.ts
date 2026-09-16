import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InversionRequest, InversionResponse, ResumenInversionistaResponse } from '../models/inversion.model';

@Injectable({
  providedIn: 'root'
})
export class InversionService {
  private apiUrl = environment.apiUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  // ── Inversionista ──────────────────────────────────────────────────────────

  getMisInversiones(): Observable<InversionResponse[]> {
    return this.http.get<InversionResponse[]>(`${this.apiUrl}/inversiones/mis-inversiones`);
  }

  getResumen(): Observable<ResumenInversionistaResponse> {
    return this.http.get<ResumenInversionistaResponse>(`${this.apiUrl}/inversiones/resumen`);
  }

  crearInversion(request: InversionRequest): Observable<InversionResponse> {
    return this.http.post<InversionResponse>(`${this.apiUrl}/inversiones`, request);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  listarTodasAdmin(): Observable<InversionResponse[]> {
    return this.http.get<InversionResponse[]>(`${this.apiUrl}/inversiones/admin`);
  }

  cambiarEstado(id: number, estado: string): Observable<InversionResponse> {
    return this.http.put<InversionResponse>(`${this.apiUrl}/inversiones/${id}/estado`, null, {
      params: { estado }
    });
  }
}
