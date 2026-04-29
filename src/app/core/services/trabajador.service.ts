import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Trabajador, TrabajadorRequest } from '../models/trabajador.model';

@Injectable({
  providedIn: 'root'
})
export class TrabajadorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/trabajadores`;

  listar(): Observable<Trabajador[]> {
    return this.http.get<Trabajador[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<Trabajador> {
    return this.http.get<Trabajador>(`${this.apiUrl}/${id}`);
  }

  crear(request: TrabajadorRequest): Observable<Trabajador> {
    return this.http.post<Trabajador>(this.apiUrl, request);
  }

  actualizar(id: number, request: TrabajadorRequest): Observable<Trabajador> {
    return this.http.put<Trabajador>(`${this.apiUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cambiarEstado(id: number, habilitado: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado`, { habilitado });
  }
}
