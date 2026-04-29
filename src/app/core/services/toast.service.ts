import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<ToastMessage[]>([]);
  readonly currentToasts = this.toasts.asReadonly();

  show(message: string, type: ToastType = 'success') {
    const id = Date.now();
    this.toasts.update(t => [...t, { id, message, type }]);

    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
      this.remove(id);
    }, 3000);
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
