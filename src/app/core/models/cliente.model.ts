// src/app/core/models/cliente.model.ts

export interface Cliente {
  id: number;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  domicilio: string;
  fechaNacimiento: Date;
  estadoCivil: string;
  situacionLaboral: string;
  empresa?: string;
  cargoOcupacion?: string;
  ingresoMensual?: number;
  ingresoBrutoMensual?: number;
  rucEmpresa?: string;
  rucPropio?: string;
  telefonoEmpresa?: string;
  fechaIngresoLaboral?: Date;
  direccionEmpresa?: string;
  canalEstadoCuenta?: string;
  telefono?: string;
  celular?: string;
  
  // Ubicación desglosada
  departamento?: string;
  provincia?: string;
  distrito?: string;
  urbanizacion?: string;
  manzana?: string;
  lote?: string;
  codigoPostal?: string;
  nacionalidad?: string;
  gradoInstruccion?: string;
  
  datosSolicitud?: string; // JSON string
  fotoUrl?: string;
  tipoPersona?: string;
  conyuge?: Conyuge;
  estado: string; // ACTIVO, MOROSO, BLOQUEADO
}

export interface Conyuge {
  id?: number;
  nombreCompleto: string;
  dni: string;
  ocupacion?: string;
  ingresosMensuales?: number;
  telefono?: string;
  nacionalidad?: string;
  fechaNacimiento?: Date;
  situacionLaboral?: string;
  empresa?: string;
  profesion?: string;
  direccion?: string;
}
