import { Usuario } from './usuario.model';

export interface Trabajador {
  usuarioId: number;
  trabajadorId: number;
  email: string;
  nombreCompleto: string;
  rol: string;
  dni: string;
  habilitado: boolean;
  cargo: string;
  salario: number;
  fechaContratacion: string;
  tipoContrato: string;
  contratoActivo: boolean;
}

export interface TrabajadorRequest {
  nombreCompleto: string;
  email: string;
  contrasena?: string;
  rolId: number;
  dni: string;
  cargo: string;
  salario: number;
  fechaContratacion: string;
  tipoContrato: string;
  contratoActivo: boolean;
}
