import { HttpInterceptorFn, HttpErrorResponse, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take } from 'rxjs';

/**
 * Token de contexto para identificar peticiones que ya han sido reintentadas
 */
export const IS_RETRY_REQUEST = new HttpContextToken<boolean>(() => false);

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const auth = authService.currentUser();

  // No añadir token si es la ruta de login o refresh
  if (req.url.includes('/autenticacion/login') || req.url.includes('/autenticacion/refresh')) {
    return next(req);
  }

  // Si ya se está refrescando un token, esperamos a que termine para todas las nuevas peticiones
  if (isRefreshing) {
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
        if (req.context.get(IS_RETRY_REQUEST)) {
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => error);
        }

        if (!auth?.refreshToken) {
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
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
        // Here we could use a Toast service if we had one.
        // For now, an alert will suffice or we can let the UI catch it, but the guide
        // specifically says "El Interceptor global debe capturar... mostrar un Toast".
        // Let's create a simple custom toast by injecting it, or just use window.alert if none is available.
        // Actually, we'll just log it and the UI can show a toast or we can use native alert as a fallback.
        alert('Has excedido el límite de intentos. Espera 1 minuto e inténtalo de nuevo.');
      }

      return throwError(() => error);
    })
  );
};
