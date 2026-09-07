import { BehaviorSubject } from 'rxjs';

/**
 * Estado compartido del proceso de refresh de token.
 *
 * Vive fuera del interceptor para poder reiniciarse desde el AuthService
 * al cerrar sesión, y así evitar que una sesión nueva herede el resultado
 * (por ejemplo REFRESH_FAILED) de la sesión anterior.
 */
export const REFRESH_FAILED = 'REFRESH_FAILED';

export const refreshTokenSubject = new BehaviorSubject<string | null>(null);

let refreshing = false;

export function isRefreshing(): boolean {
  return refreshing;
}

export function setRefreshing(value: boolean): void {
  refreshing = value;
}

export function resetRefreshState(): void {
  refreshing = false;
  refreshTokenSubject.next(null);
}
