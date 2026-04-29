import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TipoCredito, RangoInteres, TipoCreditoRequest } from '../models/tasas.model';

@Injectable({
  providedIn: 'root'
})
export class TasasService {
  private readonly tiposUrl = `${environment.apiUrl}/tipos-credito`;
  private readonly rangosUrl = `${environment.apiUrl}/admin/rangos`;

  constructor(private http: HttpClient) {}

  // Tipos de Crédito
  getTiposCredito(): Observable<TipoCredito[]> {
    return this.http.get<TipoCredito[]>(`${this.tiposUrl}/todos`);
  }

  updateTipoCredito(id: number, data: TipoCreditoRequest): Observable<TipoCredito> {
    return this.http.put<TipoCredito>(`${this.tiposUrl}/${id}`, data);
  }

  // Rangos de Interés
  getRangosPorTipo(tipoId: number): Observable<RangoInteres[]> {
    return this.http.get<RangoInteres[]>(`${this.rangosUrl}/tipo/${tipoId}`);
  }

  crearRango(rango: RangoInteres): Observable<RangoInteres> {
    return this.http.post<RangoInteres>(this.rangosUrl, rango);
  }

  eliminarRango(id: number): Observable<any> {
    return this.http.delete(`${this.rangosUrl}/${id}`);
  }
}
