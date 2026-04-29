import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permiso } from '../models/permiso.model';

@Injectable({
  providedIn: 'root'
})
export class PermisoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/permisos`;

  listarPorRol(rolId: number): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.apiUrl}/rol/${rolId}`);
  }

  asignar(permiso: Permiso): Observable<Permiso> {
    return this.http.post<Permiso>(this.apiUrl, permiso);
  }

  actualizar(id: number, permiso: Permiso): Observable<Permiso> {
    return this.http.put<Permiso>(`${this.apiUrl}/${id}`, permiso);
  }
}
