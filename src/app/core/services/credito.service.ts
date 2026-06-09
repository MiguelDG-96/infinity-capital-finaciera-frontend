// src/app/core/services/credito.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { 
  SolicitudCredito, 
  EvaluacionCredito, 
  SolicitudPendiente, 
  Credito, 
  Movimiento,
  Cuota,
  Garante 
} from '../models/credito.model';

import { CreditoMapper } from '../mappers/credito.mapper';

import {
  SolicitudCreditoResponseDTO,
  SolicitudPendienteResponseDTO,
  CreditoDTOResponse,
  MovimientoDTO,
  CuotaDTO,
  UpdateCreditoRequestDTO,
  UpdateCuotaRequestDTO
} from '../models/credito.dto';

@Injectable({
  providedIn: 'root'
})
export class CreditoService {
  private apiUrl = environment.apiUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  // ==========================================
  // CLIENTE ENDPOINTS
  // ==========================================

  solicitarCredito(solicitud: SolicitudCredito): Observable<SolicitudCreditoResponseDTO> {
    const dto = CreditoMapper.toSolicitudCreditoDTO(solicitud);
    return this.http.post<SolicitudCreditoResponseDTO>(`${this.apiUrl}/solicitudes`, dto);
  }

  obtenerMisCreditos(): Observable<Credito[]> {
    return this.http.get<CreditoDTOResponse[]>(`${this.apiUrl}/creditos/mis-creditos`).pipe(
      map(dtos => dtos.map(dto => CreditoMapper.toCreditoDomain(dto)))
    );
  }

  obtenerCreditoPorId(id: number): Observable<Credito> {
    // El backend no tiene un GET /creditos/{id} directo en el controlador publico? 
    // Revisando CreditoControlador, solo tiene /mis-creditos. 
    // Usaremos /mis-creditos y filtraremos o el backend podria necesitar el endpoint.
    // Pero espera, /admin/{id}/cronograma existe. 
    // Para simplificar, si el backend devuelve todos en /mis-creditos, podemos filtrar.
    // No, mejor obtengamos la lista y filtremos por ahora para no tocar backend.
    return this.obtenerMisCreditos().pipe(
      map(creditos => creditos.find(c => c.id === id)!)
    );
  }

  obtenerMovimientos(creditoId: number): Observable<Movimiento[]> {
    return this.http.get<MovimientoDTO[]>(`${this.apiUrl}/creditos/movimientos/${creditoId}`).pipe(
      map(dtos => dtos.map(dto => CreditoMapper.toMovimientoDomain(dto)))
    );
  }

  pagarCuota(cuotaId: number, monto: number, metodoPago: string, numeroComprobante?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/creditos/cuotas/${cuotaId}/pagar`, { monto, metodoPago, numeroComprobante });
  }

  pagoAnticipado(creditoId: number, monto: number, metodoPago: string, numeroComprobante?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/creditos/${creditoId}/pago-anticipado`, { monto, metodoPago, numeroComprobante });
  }

  registrarPagoRevision(cuotaId: number, monto: number, metodoPago: string, numeroComprobante: string, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('monto', monto.toString());
    formData.append('metodoPago', metodoPago);
    formData.append('numeroComprobante', numeroComprobante);
    formData.append('archivo', archivo);
    return this.http.post(`${this.apiUrl}/creditos/cuotas/${cuotaId}/registrar-pago-revision`, formData);
  }

  verificarPago(cuotaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/creditos/cuotas/${cuotaId}/verificar-pago`, {});
  }

  rechazarPago(cuotaId: number, comentarioRechazo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/creditos/cuotas/${cuotaId}/rechazar-pago`, { comentarioRechazo });
  }

  obtenerCronograma(creditoId: number): Observable<Cuota[]> {
    return this.http.get<CuotaDTO[]>(`${this.apiUrl}/creditos/mis-creditos/${creditoId}/cronograma`).pipe(
      map(dtos => dtos.map(dto => CreditoMapper.toCuotaDomain(dto)))
    );
  }

  agregarGarante(creditoId: number, garante: Garante): Observable<Garante> {
    return this.http.post<Garante>(`${this.apiUrl}/creditos/${creditoId}/garante`, garante);
  }

  // ==========================================
  // CATALOGO ENDPOINTS
  // ==========================================

  obtenerMonedasActivas(): Observable<{ id: number, nombre: string, simbolo: string }[]> {
    return this.http.get<any[]>(`${this.apiUrl}/monedas`);
  }

  obtenerTiposCreditoActivos(): Observable<{ id: number, nombre: string }[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tipos-credito`);
  }

  // ==========================================
  // ADMINISTRADOR ENDPOINTS
  // ==========================================

  listarSolicitudesPendientes(): Observable<SolicitudPendiente[]> {
    return this.http.get<SolicitudPendienteResponseDTO[]>(`${this.apiUrl}/creditos/solicitudes-pendientes`).pipe(
      map(dtos => dtos.map(dto => CreditoMapper.toSolicitudPendienteDomain(dto)))
    );
  }

  evaluarSolicitud(id: number, evaluacion: EvaluacionCredito): Observable<{ mensaje: string }> {
    const dto = CreditoMapper.toEvaluarSolicitudDTO(evaluacion);
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/creditos/solicitudes/${id}/evaluar`, dto);
  }

  obtenerCarteraGeneral(): Observable<Credito[]> {
    return this.http.get<CreditoDTOResponse[]>(`${this.apiUrl}/creditos/admin/cartera-general`).pipe(
      map(dtos => dtos.map(dto => CreditoMapper.toCreditoDomain(dto)))
    );
  }

  crearCreditoDirecto(request: any): Observable<SolicitudCreditoResponseDTO> {
    return this.http.post<SolicitudCreditoResponseDTO>(`${this.apiUrl}/creditos/admin/directo`, request);
  }

  desembolsarCredito(creditoId: number): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/creditos/admin/desembolsar/${creditoId}`, {});
  }

  registrarPagoGlobal(creditoId: number, monto: number, metodoPago: string, numeroComprobante?: string): Observable<any> {
    const payload = { monto, metodoPago, numeroComprobante };
    return this.http.post<any>(`${this.apiUrl}/creditos/admin/${creditoId}/pago-global`, payload);
  }

  generarCuotaPostVencimiento(creditoId: number): Observable<{ mensaje: string, nuevaCuotaId: number }> {
    return this.http.post<{ mensaje: string, nuevaCuotaId: number }>(`${this.apiUrl}/creditos/admin/${creditoId}/generar-cuota-post-vencimiento`, {});
  }

  generarCuotasPostVencimientoHastaHoy(creditoId: number): Observable<{ mensaje: string, cantidadGenerada: number }> {
    return this.http.post<{ mensaje: string, cantidadGenerada: number }>(`${this.apiUrl}/creditos/admin/${creditoId}/generar-cuotas-post-vencimiento-hasta-hoy`, {});
  }

  resolverContrato(creditoId: number, motivo: string): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/creditos/admin/resolver/${creditoId}`, { motivo });
  }

  obtenerCronogramaAdmin(creditoId: number): Observable<Cuota[]> {
    return this.http.get<CuotaDTO[]>(`${this.apiUrl}/creditos/admin/${creditoId}/cronograma`).pipe(
      map(dtos => dtos.map(dto => CreditoMapper.toCuotaDomain(dto)))
    );
  }

  obtenerCreditoPorIdAdmin(id: number): Observable<Credito> {
    return this.obtenerCarteraGeneral().pipe(
      map(creditos => creditos.find(c => c.id === id)!)
    );
  }

  actualizarCredito(id: number, request: UpdateCreditoRequestDTO): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/creditos/${id}`, request);
  }

  actualizarCuota(cuotaId: number, request: UpdateCuotaRequestDTO): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/creditos/cuotas/${cuotaId}`, request);
  }

  postergarCuota(cuotaId: number): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/creditos/cuotas/${cuotaId}/postergar`, {});
  }

  regenerarCronograma(creditoId: number): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/creditos/admin/regenerar-cronograma/${creditoId}`, {});
  }

  formalizarRevisionOficina(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/creditos/solicitudes/${id}/revision-oficina`, payload);
  }

  renovarSoloInteres(cuotaId: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/creditos/cuotas/${cuotaId}/renovar-solo-interes`, data);
  }

  obtenerReporteCaja(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/creditos/admin/reporte-caja`);
  }

  enviarEstadoCuenta(creditoId: number, pdfBlob: Blob): Observable<{ mensaje: string }> {
    const formData = new FormData();
    formData.append('pdf', pdfBlob, `EstadoCuenta_${creditoId}.pdf`);
    return this.http.post<{ mensaje: string }>(
      `${this.apiUrl}/creditos/admin/${creditoId}/enviar-estado-cuenta`,
      formData
    );
  }
}
