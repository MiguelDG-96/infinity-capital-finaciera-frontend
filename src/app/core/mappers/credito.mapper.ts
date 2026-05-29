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

  static parseLocalDate(dateInput: any): Date {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    
    const dateStr = String(dateInput).trim();
    
    // Si contiene la fecha en formato YYYY-MM-DD
    const match = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // 0-indexed
      const day = parseInt(match[3], 10);
      
      const timeMatch = dateStr.match(/(?:T|\s)(\d{2}):(\d{2}):(\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = parseInt(timeMatch[3], 10);
        return new Date(year, month, day, hours, minutes, seconds);
      }
      return new Date(year, month, day, 0, 0, 0, 0);
    }
    
    return new Date(dateStr);
  }

  static toSolicitudCreditoDTO(domain: SolicitudCredito): SolicitudCreditoRequestDTO {
    return {
      tipoDocumento: domain.tipoDocumento,
      numeroDocumento: domain.numeroDocumento,
      domicilio: domain.domicilio,
      
      tipoPersona: domain.tipoPersona,
      nacionalidad: domain.nacionalidad,
      fechaNacimiento: domain.fechaNacimiento,
      estadoCivil: domain.estadoCivil,
      gradoInstruccion: domain.gradoInstruccion,

      departamento: domain.departamento,
      provincia: domain.provincia,
      distrito: domain.distrito,
      direccion: domain.direccion,
      urbanizacion: domain.urbanizacion,
      manzana: domain.manzana,
      lote: domain.lote,
      codigoPostal: domain.codigoPostal,
      referencia: domain.referencia,

      situacionLaboral: domain.situacionLaboral,
      empresa: domain.empresa,
      cargoOcupacion: domain.cargoOcupacion,
      ingresoMensual: domain.ingresoMensual,
      ingresoBrutoMensual: domain.ingresoBrutoMensual,
      fechaIngresoLaboral: domain.fechaIngresoLaboral,
      rucEmpresa: domain.rucEmpresa,
      telefonoEmpresa: domain.telefonoEmpresa,
      direccionEmpresa: domain.direccionEmpresa,
      rucPropio: domain.rucPropio,
      otrosIngresos: domain.otrosIngresos,
      tipoRenta: domain.tipoRenta,
      nombrePropioNegocio: domain.nombrePropioNegocio,
      numeroDependientes: domain.numeroDependientes,

      telefono: domain.telefono,
      celular: domain.celular,

      razonSocialJuridica: domain.razonSocialJuridica,
      rucJuridico: domain.rucJuridico,
      representanteLegal: domain.representanteLegal,

      tipoCreditoId: domain.tipoCreditoId,
      monedaId: domain.monedaId,
      montoSolicitado: domain.montoSolicitado,
      plazoMeses: domain.plazoMeses,
      periodoGracia: domain.periodoGracia,
      bancoDesembolso: domain.bancoDesembolso,
      cuentaDesembolso: domain.cuentaDesembolso,
      canalEstadoCuenta: domain.canalEstadoCuenta,
      descuentoRetencion: domain.descuentoRetencion,

      nombresConyuge: domain.nombresConyuge,
      apellidoPaConyuge: domain.apellidoPaConyuge,
      apellidoMatConyuge: domain.apellidoMatConyuge,
      conyugeTipoDocumento: domain.conyugeTipoDocumento,
      conyugeNumeroDocumento: domain.conyugeNumeroDocumento,
      conyugeIngresos: domain.conyugeIngresos,
      conyugeOcupacion: domain.conyugeOcupacion,

      garanteNombre: domain.garanteNombre,
      garanteDni: domain.garanteDni,
      garanteTelefono: domain.garanteTelefono
    };
  }

  static toEvaluarSolicitudDTO(domain: EvaluacionCredito): EvaluarSolicitudRequestDTO {
    return {
      nuevoEstado: domain.estadoAprobacion,
      observaciones: domain.observaciones,
      montoAprobado: domain.montoAprobado,
      plazoMeses: domain.plazoMeses,
      tasaAprobada: domain.tasaAprobada,
      descuentoRetencion: domain.descuentoRetencion,
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
      fechaSolicitud: this.parseLocalDate(dto.fechaSolicitud),
      estado: dto.estado as EstadoCredito
    };
  }

  static toCuotaDomain(dto: CuotaDTO): Cuota {
    return {
      id: dto.id,
      numeroCuota: dto.numeroCuota,
      fechaVencimiento: this.parseLocalDate(dto.fechaVencimiento),
      totalCuota: dto.totalCuota,
      capital: dto.capital,
      interes: dto.interes,
      interesMora: dto.interesMora,
      penalidad: dto.penalidad,
      comision: dto.comision,
      seguro: dto.seguro,
      estadoCuota: dto.estadoCuota as Cuota['estadoCuota'],
      fechaPago: dto.fechaPago ? this.parseLocalDate(dto.fechaPago) : undefined,
      esGracia: dto.esGracia,
      metodoPago: dto.metodoPago,
      numeroComprobante: dto.numeroComprobante,
      observacion: dto.observacion,
      imagenComprobante: dto.imagenComprobante,
      montoPagadoCliente: dto.montoPagadoCliente,
      comentarioRechazo: dto.comentarioRechazo
    };
  }

  static toCreditoDomain(dto: CreditoDTOResponse): Credito {
    return {
      id: dto.id,
      montoCredito: dto.montoCredito ?? 0,
      montoAprobado: dto.montoAprobado,
      descuentoRetencion: dto.descuentoRetencion,
      debeActualidad: dto.debeActualidad ?? 0,
      nombreCliente: dto.cliente?.usuario?.nombreCompleto || 'Cliente Desconocido',
      documento: dto.cliente ? `${dto.cliente.tipoDocumento} - ${dto.cliente.numeroDocumento}` : 'Sin Documento',
      plazoMeses: dto.plazoMeses,
      tasaAprobada: dto.tasaAprobada,
      estado: dto.estado as EstadoCredito,
      fechaDesembolso: dto.fechaDesembolso ? this.parseLocalDate(dto.fechaDesembolso) : undefined,
      fechaVencimiento: dto.fechaVencimiento ? this.parseLocalDate(dto.fechaVencimiento) : undefined,
      fechaInicio: dto.fechaInicio ? this.parseLocalDate(dto.fechaInicio) : undefined,
      tipoCredito: dto.tipoCredito?.nombre || 'General',
      moneda: dto.moneda?.nombre || 'Moneda Local',
      simboloMoneda: dto.moneda?.simbolo || '$',
      cuotas: dto.cuotas ? dto.cuotas.map(dto => this.toCuotaDomain(dto)) : [],
      observacionEvaluador: dto.observacionEvaluador,
      gananciaInteres: dto.gananciaInteres,
      montoTotal: dto.montoTotal,
      cuotaMensual: dto.cuotaMensual,
      periodoGracia: dto.periodoGracia,
      bancoDesembolso: dto.bancoDesembolso,
      cuentaDesembolso: dto.cuentaDesembolso,
      tem: dto.tem || dto.tasaAprobada,
      fechaSolicitud: dto.fechaSolicitud ? this.parseLocalDate(dto.fechaSolicitud) : (dto.fechaInicio ? this.parseLocalDate(dto.fechaInicio) : new Date()),
      cliente: dto.cliente ? {
          // Spread ALL fields from the DTO client object so nothing is lost
          ...(dto.cliente as any),
          // Override / normalize key fields
          id: (dto.cliente as any).id || 0,
          nombre: dto.cliente.usuario?.nombreCompleto || 'Cliente Desconocido',
          tipoDocumento: dto.cliente.tipoDocumento,
          numeroDocumento: dto.cliente.numeroDocumento,
          domicilio: (dto.cliente as any).domicilio || (dto.cliente as any).direccion || '',
          usuario: dto.cliente.usuario,
          estado: (dto.cliente as any).estado || 'ACTIVO',
      } as any : undefined,
      garantes: dto.garantes || []
    };
  }


  static toMovimientoDomain(dto: MovimientoDTO): Movimiento {
    return {
      id: dto.id,
      fecha: this.parseLocalDate(dto.fechaHora),
      tipo: dto.tipo,
      monto: dto.monto,
      descripcion: dto.descripcion
    };
  }
}
