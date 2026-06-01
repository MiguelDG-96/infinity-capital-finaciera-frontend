// src/app/core/models/patrimonio.model.ts

/**
 * Tipos válidos de activos
 */
export type TipoActivo = 'INMUEBLE' | 'AHORROS' | 'PLAZO_FIJO' | 'AUTO' | 'OTRO';

/**
 * Tipos válidos de pasivos
 */
export type TipoPasivo = 'TARJETAS' | 'CORTO_PLAZO' | 'LARGO_PLAZO' | 'HIPOTECARIO' | 'OTRO';

export interface ActivoResponse {
  id: number;
  tipo: TipoActivo;
  descripcion?: string;
  valorEstimado?: number;
  observacion?: string;
  /** URL relativa del respaldo. Construir URL completa usando environment.apiUrl.replace('/api/v1','') */
  docUrl?: string;
}

export interface PasivoResponse {
  id: number;
  tipo: TipoPasivo;
  entidadAcreedora?: string;
  /** Saldo de deuda pendiente */
  montoPendiente?: number;
  /** Pago mensual comprometido */
  cuotaMensual?: number;
  /** Fecha de vencimiento formato "MM/YYYY". Ej: "06/2027" */
  vencimiento?: string;
  observacion?: string;
  /** URL relativa del respaldo */
  docUrl?: string;
}

export interface PatrimonioResponse {
  activos: ActivoResponse[];
  pasivos: PasivoResponse[];
  totalActivos: number;
  totalPasivos: number;
  patrimonioNeto: number;
}

export interface ActivoRequest {
  tipo: TipoActivo;
  descripcion?: string;
  valorEstimado?: number;
  observacion?: string;
}

export interface PasivoRequest {
  tipo: TipoPasivo;
  entidadAcreedora?: string;
  montoPendiente?: number;
  cuotaMensual?: number;
  /** Formato "MM/YYYY". Ej: "06/2027" */
  vencimiento?: string;
  observacion?: string;
}

/** Etiquetas legibles para los tipos de activos */
export const LABELS_ACTIVO: Record<TipoActivo, string> = {
  INMUEBLE:   'Inmueble / Propiedad',
  AHORROS:    'Ahorros / Depósitos',
  PLAZO_FIJO: 'Depósito a Plazo Fijo',
  AUTO:       'Vehículo / Auto',
  OTRO:       'Otros Activos',
};

/** Etiquetas legibles para los tipos de pasivos */
export const LABELS_PASIVO: Record<TipoPasivo, string> = {
  TARJETAS:    'Tarjetas de Crédito',
  CORTO_PLAZO: 'Préstamo Corto Plazo',
  LARGO_PLAZO: 'Préstamo Largo Plazo',
  HIPOTECARIO: 'Crédito Hipotecario',
  OTRO:        'Otros Pasivos',
};
