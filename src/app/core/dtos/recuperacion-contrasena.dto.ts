export interface OlvideContrasenaRequestDto {
  email: string;
}

export interface RestablecerContrasenaRequestDto {
  email: string;
  codigo: string;
  nuevaContrasena: string;
}
