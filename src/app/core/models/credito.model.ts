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
  tipoDocumento: string;
  numeroDocumento: string;
  domicilio: string;
  tipoCreditoId: number;
  monedaId: number;
  montoSolicitado?: number;
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
  estadoCuota: 'PENDIENTE' | 'PAGADO' | 'MORA' | 'PAGADO_PARCIAL' | 'POSTERGADA';
  fechaPago?: Date;
  esGracia?: boolean;
  metodoPago?: string;
  numeroComprobante?: string;
  observacion?: string;
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
  debeActualidad: number;
  nombreCliente?: string;
  documento?: string;
  plazoMeses: number;
  tasaAprobada?: number;
  estado: EstadoCredito;
  fechaDesembolso?: Date;
  fechaVencimiento?: Date;
  fechaInicio?: Date;
  tipoCredito: string;
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
  cuentaDesembolso?: string;
  cliente?: Cliente;
  garantes?: Garante[];
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

