export interface InversionResponse {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  monto: number;
  plazoMeses: number;
  tasaAnual: number;
  fechaInicio: string;       // ISO: 'YYYY-MM-DD'
  fechaVencimiento: string;  // ISO: 'YYYY-MM-DD'
  interesProyectado: number;
  montoFinal: number;
  estado: 'ACTIVA' | 'VENCIDA' | 'LIQUIDADA' | 'CANCELADA';
  moneda: string;
  observaciones?: string;
  fechaCreacion: string;
  fechaLiquidacion?: string;
  diasRestantes: number;
  progresoPorc: number;
}

export interface ResumenInversionistaResponse {
  capitalTotalInvertido: number;
  interesesProyectadosActivos: number;
  interesesGanadosHistorico: number;
  montoTotalFinalProyectado: number;
  inversionesActivas: number;
  inversionesVencidas: number;
  inversionesLiquidadas: number;
}

export interface InversionRequest {
  monto: number;
  plazoMeses: number;
  tasaAnual: number;
  fechaInicio?: string;
  moneda?: string;
  observaciones?: string;
}
