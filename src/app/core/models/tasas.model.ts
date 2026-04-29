export interface RangoInteres {
  id?: number;
  montoMinimo: number;
  montoMaximo: number;
  tasaMensual: number;
  tipoCreditoId?: number;
}

export interface TipoCredito {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  temDefecto: number;
  rangos?: RangoInteres[];
}

export interface TipoCreditoRequest {
  nombre: string;
  descripcion: string;
  activo: boolean;
  temDefecto: number;
}
