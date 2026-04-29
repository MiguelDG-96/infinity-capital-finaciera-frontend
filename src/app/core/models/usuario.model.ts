export interface Usuario {
  id: number;
  email: string;
  nombreCompleto: string;
  rol: Rol;
  habilitado: boolean;
}

export interface Rol {
  id: number;
  nombre: string;
}

export interface UsuarioRequest {
  email: string;
  contrasena?: string;
  nombreCompleto: string;
  rolId: number;
}
