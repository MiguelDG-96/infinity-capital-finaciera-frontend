export interface Permiso {
  id?: number;
  rolId: number;
  moduloId: number;
  modulo?: string; // Nombre del modulo que viene del backend a veces
  verModulo: boolean;
  pView: boolean;
  pCreate: boolean;
  pUpdate: boolean;
  pDelete: boolean;
}
