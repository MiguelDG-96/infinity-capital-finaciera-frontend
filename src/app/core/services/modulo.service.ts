import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Modulo } from '../models/modulo.model';

@Injectable({
  providedIn: 'root'
})
export class ModuloService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/modulos`;

  listar(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(this.apiUrl);
  }

  crear(modulo: Modulo): Observable<Modulo> {
    return this.http.post<Modulo>(this.apiUrl, modulo);
  }

  actualizar(id: number, modulo: Modulo): Observable<Modulo> {
    return this.http.put<Modulo>(`${this.apiUrl}/${id}`, modulo);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  reordenarModulos(nuevoOrden: { id: number, orden: number }[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/reordenar`, nuevoOrden);
  }
}
