// src/app/core/mappers/credito.mapper.ts

import {
  SolicitudCreditoRequestDTO,
  EvaluarSolicitudRequestDTO,
  SolicitudPendienteResponseDTO,
  CreditoDTOResponse,
  CuotaDTO,
  MovimientoDTO
} from '../models/credito.dto';
import {
  SolicitudCredito,
  EvaluacionCredito,
  SolicitudPendiente,
  Credito,
  Cuota,
  Movimiento,
  EstadoCredito
} from '../models/credito.model';

export class CreditoMapper {

  static toSolicitudCreditoDTO(domain: SolicitudCredito): SolicitudCreditoRequestDTO {
    return {
      tipoDocumento: domain.tipoDocumento,
      numeroDocumento: domain.numeroDocumento,
      domicilio: domain.domicilio,
      tipoCreditoId: domain.tipoCreditoId,
      monedaId: domain.monedaId,
      montoSolicitado: domain.montoSolicitado
    };
  }

  static toEvaluarSolicitudDTO(domain: EvaluacionCredito): EvaluarSolicitudRequestDTO {
    return {
      nuevoEstado: domain.estadoAprobacion,
      observaciones: domain.observaciones,
      montoAprobado: domain.montoAprobado,
      plazoMeses: domain.plazoMeses,
      tasaAprobada: domain.tasaAprobada,
      requisitosASolicitar: domain.requisitos
    };
  }

  static toSolicitudPendienteDomain(dto: SolicitudPendienteResponseDTO): SolicitudPendiente {
    return {
      creditoId: dto.creditoId,
      nombreCliente: dto.nombreCliente,
      documento: `${dto.tipoDocumento} - ${dto.numeroDocumento}`,
      domicilio: dto.domicilio,
      montoSolicitado: dto.montoSolicitado,
      prestamo: `${dto.tipoCreditoNombre} (${dto.monedaNombre})`,
      fechaSolicitud: new Date(dto.fechaSolicitud),
      estado: dto.estado as EstadoCredito
    };
  }

  static toCuotaDomain(dto: CuotaDTO): Cuota {
    return {
      id: dto.id,
      numeroCuota: dto.numeroCuota,
      fechaVencimiento: new Date(dto.fechaVencimiento),
      totalCuota: dto.totalCuota,
      capital: dto.capital,
      interes: dto.interes,
      interesMora: dto.interesMora,
      penalidad: dto.penalidad,
      comision: dto.comision,
      seguro: dto.seguro,
      estadoCuota: dto.estadoCuota as Cuota['estadoCuota'],
      fechaPago: dto.fechaPago ? new Date(dto.fechaPago) : undefined,
      esGracia: dto.esGracia,
      metodoPago: dto.metodoPago,
      numeroComprobante: dto.numeroComprobante,
      observacion: dto.observacion
    };
  }

  static toCreditoDomain(dto: CreditoDTOResponse): Credito {
    return {
      id: dto.id,
      montoCredito: dto.montoCredito ?? 0,
      montoAprobado: dto.montoAprobado,
      debeActualidad: dto.debeActualidad ?? 0,
      nombreCliente: dto.cliente?.usuario?.nombreCompleto || 'Cliente Desconocido',
      documento: dto.cliente ? `${dto.cliente.tipoDocumento} - ${dto.cliente.numeroDocumento}` : 'Sin Documento',
      plazoMeses: dto.plazoMeses,
      tasaAprobada: dto.tasaAprobada,
      estado: dto.estado as EstadoCredito,
      fechaDesembolso: dto.fechaDesembolso ? new Date(dto.fechaDesembolso) : undefined,
      fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined,
      fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : undefined,
      tipoCredito: dto.tipoCredito?.nombre || 'General',
      moneda: dto.moneda?.nombre || 'Moneda Local',
      simboloMoneda: dto.moneda?.simbolo || '$',
      cuotas: dto.cuotas ? dto.cuotas.map(dto => this.toCuotaDomain(dto)) : [],
      observacionEvaluador: dto.observacionEvaluador,
      gananciaInteres: dto.gananciaInteres,
      montoTotal: dto.montoTotal,
      cuotaMensual: dto.cuotaMensual,
      periodoGracia: dto.periodoGracia,
      cuentaDesembolso: dto.cuentaDesembolso,
      tem: dto.tasaAprobada,
      fechaSolicitud: dto.fechaSolicitud ? new Date(dto.fechaSolicitud) : (dto.fechaInicio ? new Date(dto.fechaInicio) : new Date()),
      cliente: dto.cliente ? {
          id: 0, // Fallback as ID isn't in this DTO level
          nombre: dto.cliente.usuario.nombreCompleto,
          tipoDocumento: dto.cliente.tipoDocumento,
          numeroDocumento: dto.cliente.numeroDocumento,
          domicilio: dto.cliente.numeroDocumento, // Fallback
          usuario: dto.cliente.usuario,
          estado: 'ACTIVO'
      } as any : undefined,
      garantes: dto.garantes || []
    };
  }


  static toMovimientoDomain(dto: MovimientoDTO): Movimiento {
    return {
      id: dto.id,
      fecha: new Date(dto.fechaHora),
      tipo: dto.tipo,
      monto: dto.monto,
      descripcion: dto.descripcion
    };
  }
}
