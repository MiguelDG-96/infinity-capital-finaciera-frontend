import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AutenticacionRequestDto } from '../dtos/autenticacion-request.dto';
import { AutenticacionResponseDto } from '../dtos/autenticacion-response.dto';
import { RegistroRequestDto } from '../dtos/registro-request.dto';
import { VerificacionRequestDto } from '../dtos/verificacion-request.dto';
import { OlvideContrasenaRequestDto, RestablecerContrasenaRequestDto } from '../dtos/recuperacion-contrasena.dto';
import { AuthModel } from '../models/auth.model';
import { AuthMapper } from '../mappers/auth.mapper';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly status = signal<AuthModel | null>(this.loadFromStorage());

  // Signal separado para la foto (no viene en el JWT)
  readonly profilePhotoUrl = signal<string | null>(null);

  readonly currentUser = this.status.asReadonly();

  readonly currentUserData = computed(() => {
    const auth = this.status();
    if (!auth || !auth.accessToken) return null;
    try {
      const parts = auth.accessToken.split('.');
      if (parts.length !== 3) return null;
      const payloadBase64Url = parts[1];
      const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(payloadBase64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      const data = JSON.parse(jsonPayload);
      return data as { nombreCompleto: string; rol: string; sub: string; fotoUrl?: string };
    } catch (e) {
      return null;
    }
  });

  constructor(private http: HttpClient) {}

  updateProfilePhoto(url: string | null): void {
    this.profilePhotoUrl.set(url);
  }

  login(credentials: AutenticacionRequestDto): Observable<AuthModel> {
    const trustedToken = localStorage.getItem('infinity_trusted_device_token');
    if (trustedToken) {
      credentials.trustedDeviceToken = trustedToken;
    }

    return this.http.post<AutenticacionResponseDto>(
      `${environment.apiUrl}/autenticacion/login`,
      credentials
    ).pipe(
      map(response => AuthMapper.fromResponse(response)),
      tap(auth => {
        if (auth.message !== 'REQUIRES_2FA' && auth.accessToken) {
          this.saveToStorage(auth);
        }
      })
    );
  }

  login2FA(email: string, codigo: string, recordarDispositivo: boolean = false): Observable<AuthModel> {
    return this.http.post<AutenticacionResponseDto>(
      `${environment.apiUrl}/autenticacion/login/2fa`,
      { email, codigo, recordarDispositivo }
    ).pipe(
      map(response => AuthMapper.fromResponse(response)),
      tap(auth => {
        if (auth.accessToken) {
          this.saveToStorage(auth);
        }
      })
    );
  }

  register(data: RegistroRequestDto): Observable<AutenticacionResponseDto> {
    return this.http.post<AutenticacionResponseDto>(
      `${environment.apiUrl}/autenticacion/registro`,
      data
    );
  }

  verify(email: string, codigo: string): Observable<AuthModel> {
    const request: VerificacionRequestDto = { email, codigo };
    return this.http.post<AutenticacionResponseDto>(
      `${environment.apiUrl}/autenticacion/verificar`,
      request
    ).pipe(
      map(response => AuthMapper.fromResponse(response)),
      tap(auth => this.saveToStorage(auth))
    );
  }

  forgotPassword(email: string): Observable<any> {
    const request: OlvideContrasenaRequestDto = { email };
    return this.http.post(`${environment.apiUrl}/autenticacion/olvide-contrasena`, request);
  }

  resetPassword(data: RestablecerContrasenaRequestDto): Observable<any> {
    return this.http.post(`${environment.apiUrl}/autenticacion/restablecer-contrasena`, data);
  }

  cambiarContrasena(contrasenaActual: string, nuevaContrasena: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/usuarios/cambiar-contrasena`, {
      contrasenaActual,
      nuevaContrasena
    });
  }

  refreshToken(refreshToken: string): Observable<AuthModel> {
    return this.http.post<AutenticacionResponseDto>(
      `${environment.apiUrl}/autenticacion/refresh`,
      { refreshToken }
    ).pipe(
      map(response => AuthMapper.fromResponse(response)),
      tap(auth => this.saveToStorage(auth))
    );
  }

  getMisModulos(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/usuarios/me/modulos`);
  }

  // --- Sesiones y Dispositivos Confiables ---
  getSesionActiva(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/autenticacion/sesion-activa`);
  }

  getDispositivosConfiables(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/autenticacion/dispositivos-confiables`);
  }

  revocarDispositivo(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/autenticacion/dispositivos-confiables/${id}`);
  }

  // --- Passkeys / WebAuthn ---
  getOpcionesRegistroPasskey(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/webauthn/registro/opciones`);
  }

  verificarRegistroPasskey(responseJson: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/webauthn/registro/verificar`, responseJson);
  }

  getOpcionesLoginPasskey(email: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/webauthn/login/opciones?email=${encodeURIComponent(email)}`);
  }

  verificarLoginPasskey(email: string, responseJson: string): Observable<AutenticacionResponseDto> {
    return this.http.post<AutenticacionResponseDto>(
      `${environment.apiUrl}/webauthn/login/verificar?email=${encodeURIComponent(email)}`,
      responseJson
    ).pipe(
      tap(res => {
        if (res.token) {
          this.saveToStorage(AuthMapper.fromResponse(res));
        }
      })
    );
  }

  logout(): void {
    const stored = localStorage.getItem('auth_token');
    let refreshToken: string | null = null;
    if (stored) {
      try {
        const auth: AuthModel = JSON.parse(stored);
        refreshToken = auth.refreshToken ?? null;
      } catch (_) {}
    }

    // Limpiamos el estado local de inmediato para que la UI cambie al instante
    localStorage.removeItem('auth_token');
    this.status.set(null);
    this.profilePhotoUrl.set(null);

    // Notificamos al backend para invalidar el refreshToken en la BD.
    // Si la petición falla (sin red, token ya expirado, etc.) ignoramos el error
    // porque el usuario ya está deslogueado localmente.
    if (refreshToken) {
      this.http.post(
        `${environment.apiUrl}/autenticacion/logout`,
        { refreshToken }
      ).pipe(
        catchError(() => of(null))
      ).subscribe();
    }
  }

  private saveToStorage(auth: AuthModel): void {
    localStorage.setItem('auth_token', JSON.stringify(auth));
    if (auth.trustedDeviceToken) {
      localStorage.setItem('infinity_trusted_device_token', auth.trustedDeviceToken);
    }
    this.status.set(auth);
  }

  private loadFromStorage(): AuthModel | null {
    const stored = localStorage.getItem('auth_token');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('AuthService: Error parsing stored auth data, clearing storage.', e);
      localStorage.removeItem('auth_token');
      return null;
    }
  }
}
