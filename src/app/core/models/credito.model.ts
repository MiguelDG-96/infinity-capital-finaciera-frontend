import { Cliente } from './cliente.model';

export type EstadoCredito = 
  | 'SOLICITADO' 
  | 'EN_EVALUACION' 
  | 'EN_REVISION_HISTORIAL' 
  | 'PENDIENTE_REQUISITOS' 
  | 'APROBADO' 
  | 'RECHAZADO' 
  | 'ACTIVO' 
  | 'PAGADO' 
  | 'ATRASADO' 
  | 'MORA'
  | 'RESUELTO';

export interface SolicitudCredito {
  // Datos del documento de identidad del cliente
  tipoDocumento: string;
  numeroDocumento: string;
  domicilio?: string; // Mantenido por retrocompatibilidad

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
  bancoDesembolso?: string;
  cuentaDesembolso?: string;
  canalEstadoCuenta?: string;
  descuentoRetencion?: number;

  // Descuento de Tasa
  tasaPersonalizada?: number;
  motivoDescuentoTasa?: string;

  // Datos del cónyuge
  nombresConyuge?: string;
  apellidoPaConyuge?: string;
  apellidoMatConyuge?: string;
  conyugeTipoDocumento?: string;
  conyugeNumeroDocumento?: string;
  conyugeIngresos?: number;
  conyugeOcupacion?: string;

  // Datos del garante
  garanteNombre?: string;
  garanteDni?: string;
  garanteTelefono?: string;
}

export interface SolicitudPendiente {
  creditoId: number;
  nombreCliente: string;
  documento: string; // Combined tipo + numero
  domicilio: string;
  montoSolicitado: number;
  prestamo: string; // Combined tipoCreditoNombre + monedaNombre
  fechaSolicitud: Date;
  estado: EstadoCredito;
}

export interface EvaluacionCredito {
  estadoAprobacion: EstadoCredito;
  observaciones: string;
  montoAprobado?: number;
  plazoMeses?: number;
  tasaAprobada?: number;
  descuentoRetencion?: number;
  requisitos?: string[];
}

export interface Cuota {
  id: number;
  numeroCuota: number;
  fechaVencimiento: Date;
  totalCuota: number;
  capital: number;
  interes: number;
  interesMora?: number;
  penalidad?: number;
  comision?: number;
  seguro?: number;
  cargoRefinanciamiento?: number;
  estadoCuota: 'PENDIENTE' | 'PAGADO' | 'MORA' | 'PAGADO_PARCIAL' | 'POSTERGADA' | 'REVISION' | 'REFINANCIADO';
  fechaPago?: Date;
  esGracia?: boolean;
  metodoPago?: string;
  numeroComprobante?: string;
  observacion?: string;
  imagenComprobante?: string;
  montoPagadoCliente?: number;
  comentarioRechazo?: string;
}

export interface Movimiento {
  id: number;
  fecha: Date;
  tipo: string;
  monto: number;
  descripcion: string;
}

export interface Credito {
  id: number;
  montoCredito: number;
  montoAprobado?: number;
  descuentoRetencion?: number;
  debeActualidad: number;
  nombreCliente?: string;
  documento?: string;
  plazoMeses: number;
  tasaAprobada?: number;
  estado: EstadoCredito | 'REFINANCIADO';
  fechaDesembolso?: Date;
  fechaVencimiento?: Date;
  fechaInicio?: Date;
  tipoCredito: string;
  iconoTipoCredito?: string;
  moneda: string;
  simboloMoneda: string;
  cuotas: Cuota[];
  observacionEvaluador?: string;
  gananciaInteres?: number;
  montoTotal?: number;
  cuotaMensual?: number;
  periodoGracia?: number;
  tem?: number;
  fechaSolicitud: Date;
  bancoDesembolso?: string;
  cuentaDesembolso?: string;
  cliente?: Cliente;
  garantes?: Garante[];
  motivoDescuentoTasa?: string;
  creditoOrigenId?: number;
  analistaRegistro?: { id: number, nombreCompleto: string, email: string };
}

export interface Garante {
  id?: number;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  direccion: string;
  telefono: string;
  relacion?: string;
}

