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
  estado: string; // ACTIVO, MOROSO, BLOQUEADO
}
