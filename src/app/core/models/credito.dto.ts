// src/app/core/models/credito.dto.ts

export interface SolicitudCreditoRequestDTO {
  // Datos del documento de identidad del cliente
  tipoDocumento: string;
  numeroDocumento: string;
  domicilio?: string;

  // Perfil y Datos Personales Adicionales
  tipoPersona?: string; // NATURAL, JURIDICA
  nacionalidad?: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  gradoInstruccion?: string;

  // Ubicación Detallada
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
  urbanizacion?: string;
  manzana?: string;
  lote?: string;
  codigoPostal?: string;
  referencia?: string;

  // Situación Laboral
  situacionLaboral?: string;
  empresa?: string;
  cargoOcupacion?: string;
  ingresoMensual?: number;
  ingresoBrutoMensual?: number;
  fechaIngresoLaboral?: string;
  rucEmpresa?: string;
  telefonoEmpresa?: string;
  direccionEmpresa?: string;
  rucPropio?: string;
  otrosIngresos?: number;
  tipoRenta?: string;
  nombrePropioNegocio?: string;
  numeroDependientes?: number;

  // Contacto
  telefono?: string;
  celular?: string;

  // Datos Persona Jurídica
  razonSocialJuridica?: string;
  rucJuridico?: string;
  representanteLegal?: string;

  // Datos del crédito
  tipoCreditoId: number;
  monedaId: number;
  montoSolicitado: number;
  plazoMeses: number;
  periodoGracia?: number;
  cuentaDesembolso?: string;
  canalEstadoCuenta?: string;

  // Datos del cónyuge
  conyugeNombre?: string;
  conyugeDni?: string;
  conyugeIngresos?: number;
  conyugeOcupacion?: string;

  // Datos del garante
  garanteNombre?: string;
  garanteDni?: string;
  garanteTelefono?: string;
}

export interface SolicitudCreditoResponseDTO {
  mensaje: string;
  solicitudId: number;
  estado: string;
}

export interface EvaluarSolicitudRequestDTO {
  nuevoEstado: string; // APROBADO, RECHAZADO, EN_EVALUACION, etc.
  observaciones: string;
  montoAprobado?: number;
  plazoMeses?: number;
  tasaAprobada?: number;
  requisitosASolicitar?: string[];
}

export interface SolicitudPendienteResponseDTO {
  creditoId: number;
  nombreCliente: string;
  tipoDocumento: string;
  numeroDocumento: string;
  domicilio: string;
  montoSolicitado: number;
  monedaNombre: string;
  tipoCreditoNombre: string;
  fechaSolicitud: string; // ISO date string
  estado: string;
}

export interface CreditoDTOResponse {
  id: number;
  montoCredito: number;
  montoAprobado?: number;
  debeActualidad: number;
  plazoMeses: number;
  tasaAprobada?: number;
  tem?: number;
  estado: string;
  fechaDesembolso?: string;
  fechaVencimiento?: string;
  fechaInicio?: string;
  tipoCredito: { id: number, nombre: string };
  moneda: { id: number, nombre: string, simbolo: string };
  cliente: {
    usuario: { nombreCompleto: string };
    tipoDocumento: string;
    numeroDocumento: string;
  };
  cuotas: CuotaDTO[];
  observacionEvaluador?: string;
  gananciaInteres: number;
  montoTotal: number;
  cuotaMensual: number;
  periodoGracia?: number;
  cuentaDesembolso?: string;
  fechaSolicitud?: string; 
  garantes?: GaranteDTO[];
}

export interface GaranteDTO {
  id: number;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  direccion: string;
  telefono: string;
  relacion?: string;
}


export interface CuotaDTO {
  id: number;
  numeroCuota: number;
  fechaVencimiento: string;
  totalCuota: number;
  capital: number;
  interes: number;
  interesMora?: number;
  penalidad?: number;
  comision?: number;
  seguro?: number;
  estadoCuota: string;
  fechaPago?: string;
  esGracia?: boolean;
  metodoPago?: string;
  numeroComprobante?: string;
  observacion?: string;
}

export interface MovimientoDTO {
  id: number;
  fechaHora: string;
  tipo: string;
  monto: number;
  descripcion: string;
}

export interface UpdateCreditoRequestDTO {
  montoAprobado?: number;
  tem?: number;
  plazoMeses?: number;
  estado?: string;
  observacionEvaluador?: string;
}

export interface UpdateCuotaRequestDTO {
  fechaVencimiento?: string;
  capital?: number;
  interes?: number;
  comision?: number;
  seguro?: number;
  estadoCuota?: string;
}
