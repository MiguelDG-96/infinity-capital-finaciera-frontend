import { HttpInterceptorFn, HttpErrorResponse, HttpContextToken, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, filter, take, Observable } from 'rxjs';
import { REFRESH_FAILED, isRefreshing, refreshTokenSubject, setRefreshing } from './refresh-state';

/**
 * Token de contexto para identificar peticiones que ya han sido reintentadas
 */
export const IS_RETRY_REQUEST = new HttpContextToken<boolean>(() => false);

/** Endpoints que nunca deben llevar el token ni disparar un refresh */
const isAuthEndpoint = (url: string): boolean =>
  url.includes('/autenticacion/login') ||
  url.includes('/autenticacion/refresh') ||
  url.includes('/autenticacion/logout') ||
  url.includes('/autenticacion/registro');

const withToken = (req: HttpRequest<unknown>, token: string, isRetry = false) =>
  req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'X-Authorization': `Bearer ${token}`
    },
    context: isRetry ? req.context.set(IS_RETRY_REQUEST, true) : req.context
  });

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  /** Espera a que termine el refresh en curso y reintenta con el token nuevo */
  const waitForRefresh = (): Observable<any> =>
    refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        if (token === REFRESH_FAILED) {
          return throwError(() => new Error('Refresh failed'));
        }
        return next(withToken(req, token!, true));
      })
    );

  const cerrarSesion = () => {
    authService.logout();
    router.navigate(['/login']);
  };

  // Si ya hay un refresh en curso, todas las peticiones nuevas esperan su resultado
  if (isRefreshing()) {
    return waitForRefresh();
  }

  const auth = authService.currentUser();
  const request = auth?.accessToken ? withToken(req, auth.accessToken) : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Ya se reintentó con un token fresco: la sesión no es recuperable
        if (req.context.get(IS_RETRY_REQUEST)) {
          cerrarSesion();
          return throwError(() => error);
        }

        const currentAuth = authService.currentUser();
        if (!currentAuth?.refreshToken) {
          cerrarSesion();
          return throwError(() => error);
        }

        // Otra petición ya refrescó el token mientras esta viajaba con el viejo:
        // basta reintentar con el vigente, sin gastar otro refresh.
        const tokenEnviado = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (currentAuth.accessToken && tokenEnviado && tokenEnviado !== currentAuth.accessToken) {
          return next(withToken(req, currentAuth.accessToken, true));
        }

        // Otra petición arrancó el refresh mientras esta estaba en vuelo
        if (isRefreshing()) {
          return waitForRefresh();
        }

        setRefreshing(true);
        refreshTokenSubject.next(null);

        return authService.refreshToken(currentAuth.refreshToken).pipe(
          switchMap((newAuth) => {
            setRefreshing(false);
            refreshTokenSubject.next(newAuth.accessToken);
            return next(withToken(req, newAuth.accessToken!, true));
          }),
          catchError((refreshError) => {
            setRefreshing(false);
            refreshTokenSubject.next(REFRESH_FAILED);
            cerrarSesion();
            return throwError(() => refreshError);
          })
        );
      }

      if (error.status === 403 && error.error?.mensaje?.includes('IP ha sido bloqueada')) {
        router.navigate(['/access-denied']);
      }

      if (error.status === 429) {
        toast.show('Has excedido el límite de intentos. Espera 1 minuto e inténtalo de nuevo.', 'warning');
      }

      return throwError(() => error);
    })
  );
};
