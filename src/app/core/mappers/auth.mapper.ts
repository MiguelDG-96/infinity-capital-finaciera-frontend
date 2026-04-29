import { AutenticacionResponseDto } from '../dtos/autenticacion-response.dto';
import { AuthModel } from '../models/auth.model';

export class AuthMapper {
  static fromResponse(dto: AutenticacionResponseDto): AuthModel {
    return {
      accessToken: dto.token,
      refreshToken: dto.refreshToken,
      message: dto.mensaje
    };
  }
}
