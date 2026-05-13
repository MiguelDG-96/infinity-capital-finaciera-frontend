import { Usuario } from './usuario.model';

export interface Cliente {
  usuario?: Usuario;
  id: number;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  direccion?: string;
  referencia?: string;
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
  limiteCredito?: number;
  
  // Datos de contacto familiar y vivienda
  contactoFamiliarNombre?: string;
  contactoFamiliarCelular?: string;
  viveCasaPropia?: boolean;

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
