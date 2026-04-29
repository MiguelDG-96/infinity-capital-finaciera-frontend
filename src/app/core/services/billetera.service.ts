// src/app/core/services/billetera.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  CuentaVirtual, 
  TransaccionVirtual, 
  CuentaBancaria, 
  RetiroRequest, 
  CuentaBancariaRequest 
} from '../models/billetera.model';

@Injectable({
  providedIn: 'root'
})
export class BilleteraService {
  private apiUrl = `${environment.apiUrl}/billetera`;

  constructor(private http: HttpClient) {}

  obtenerMiSaldo(): Observable<CuentaVirtual> {
    return this.http.get<CuentaVirtual>(`${this.apiUrl}/mi-saldo`);
  }

  solicitarOtp(accion: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/otp/solicitar`, { accion });
  }

  listarTransacciones(): Observable<TransaccionVirtual[]> {
    return this.http.get<TransaccionVirtual[]>(`${this.apiUrl}/transacciones`);
  }

  listarCuentasBancarias(): Observable<CuentaBancaria[]> {
    return this.http.get<CuentaBancaria[]>(`${this.apiUrl}/cuentas-bancarias`);
  }

  agregarCuentaBancaria(request: CuentaBancariaRequest): Observable<CuentaBancaria> {
    return this.http.post<CuentaBancaria>(`${this.apiUrl}/cuentas-bancarias`, request);
  }

  eliminarCuentaBancaria(id: number, codigo: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cuentas-bancarias/${id}`, {
      params: { codigo }
    });
  }

  solicitarRetiro(request: RetiroRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/retirar`, request);
  }

  listarMisRetiros(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-retiros`);
  }
}
