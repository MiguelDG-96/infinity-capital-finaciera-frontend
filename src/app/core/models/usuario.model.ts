// Respuesta real del backend GET /api/v1/usuarios
export interface UsuarioResponse {
  id: number;
  email: string;
  nombreCompleto: string;
  rol: string; // viene como string: "ROLE_ADMIN", "ROLE_TRABAJADOR"
  habilitado: boolean;
}

// Alias para compatibilidad
export type Usuario = UsuarioResponse;

export interface Rol {
  id: number;
  nombre: string;
}

export interface UsuarioRequest {
  email: string;
  contrasena?: string;
  nombreCompleto: string;
  rolId?: number;
}
