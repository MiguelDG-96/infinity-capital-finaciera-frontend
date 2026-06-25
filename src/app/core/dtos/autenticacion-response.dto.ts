export interface AutenticacionResponseDto {
  token?: string;
  refreshToken?: string;
  mensaje: string;
  modulos?: string[];
  trustedDeviceToken?: string;
  usuarioId?: number;
  nombreCompleto?: string;
}
