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

  registrarConyuge(conyuge: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/conyuge`, conyuge);
  }

  subirFoto(clienteId: number, foto: File): Observable<{ mensaje: string, url: string }> {
    const formData = new FormData();
    formData.append('foto', foto);
    return this.http.post<{ mensaje: string, url: string }>(`${this.apiUrl}/${clienteId}/foto`, formData);
  }
}
