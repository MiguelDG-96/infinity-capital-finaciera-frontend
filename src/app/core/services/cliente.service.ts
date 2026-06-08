import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente } from '../models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clientes`;

  obtenerPerfil(): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/perfil`);
  }

  obtenerPorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  buscarPorDocumento(documento: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/buscar-por-documento/${documento}`);
  }

  registrarConyuge(conyuge: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/conyuge`, conyuge);
  }

  subirFoto(clienteId: number, foto: File): Observable<{ mensaje: string, url: string }> {
    const formData = new FormData();
    formData.append('foto', foto);
    return this.http.post<{ mensaje: string, url: string }>(`${this.apiUrl}/${clienteId}/foto`, formData);
  }

  actualizarCliente(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  actualizarPerfilPropio(data: { nombreCompleto?: string; email?: string }): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.apiUrl}/perfil`, data);
  }
}
