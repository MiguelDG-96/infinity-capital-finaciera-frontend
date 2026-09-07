import { HttpInterceptorFn, HttpErrorResponse, HttpContextToken, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, filter, take, Observable } from 'rxjs';
import { REFRESH_FAILED, isRefreshing, refreshTokenSubject, resetRefreshState, setRefreshing } from './refresh-state';

/**
 * Token de contexto para identificar peticiones que ya han sido reintentadas
 */
export const IS_RETRY_REQUEST = new HttpContextToken<boolean>(() => false);

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

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
        const retryRequest = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            'X-Authorization': `Bearer ${token}`
          },
          context: req.context.set(IS_RETRY_REQUEST, true)
        });
        return next(retryRequest);
      })
    );
}

let request = req;
if (auth?.accessToken) {
  request = req.clone({
    setHeaders: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Authorization': `Bearer ${auth.accessToken}`
    }
  });
}

return next(request).pipe(
  catchError((error: HttpErrorResponse) => {
    if (error.status === 401) {
      // Ya se reintentó con un token fresco: la sesión no es recuperable
      if (req.context.get(IS_RETRY_REQUEST)) {
        cerrarSesion();
        return throwError(() => error);
      }

      if (!auth?.refreshToken) {
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      const requestToken = req.headers.get('Authorization')?.replace('Bearer ', '');

      if (currentAuth.accessToken && requestToken && requestToken !== currentAuth.accessToken) {
        const retryRequest = req.clone({
          setHeaders: {
            Authorization: `Bearer ${currentAuth.accessToken}`,
            'X-Authorization': `Bearer ${currentAuth.accessToken}`
          },
          context: req.context.set(IS_RETRY_REQUEST, true)
        });
        return next(retryRequest);
      }

      // Otra petición arrancó el refresh mientras esta estaba en vuelo
      if (isRefreshing()) {
        return waitForRefresh();
      }

      setRefreshing(true);
      refreshTokenSubject.next(null);

      return authService.refreshToken(auth.refreshToken).pipe(
        switchMap((newAuth) => {
          isRefreshing = false;
          refreshTokenSubject.next(newAuth.accessToken);

          const retryRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newAuth.accessToken}`,
              'X-Authorization': `Bearer ${newAuth.accessToken}`
            },
            context: req.context.set(IS_RETRY_REQUEST, true)
          });
          return next(retryRequest);
        }),
        catchError((refreshError) => {
          isRefreshing = false;
          refreshTokenSubject.next(null);
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        })
      );
    } else {
      return refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap((token) => {
          const retryRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
              'X-Authorization': `Bearer ${token}`
            },
            context: req.context.set(IS_RETRY_REQUEST, true)
          });
          return next(retryRequest);
        })
      );
    }
  }

      if (error.status === 403) {
  if (error.error?.mensaje?.includes('IP ha sido bloqueada')) {
    router.navigate(['/access-denied']);
  }
}

if (error.status === 429) {
  toast.show('Has excedido el límite de intentos. Espera 1 minuto e inténtalo de nuevo.', 'warning');
}

return throwError(() => error);
    })
  );
};

// Reexportado para conveniencia de quien importe el interceptor
export { resetRefreshState };
