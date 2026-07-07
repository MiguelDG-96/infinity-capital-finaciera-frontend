import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="toast toast-end toast-top z-[9999] mt-16">
      @for (toast of toastService.currentToasts(); track toast.id) {
        <div role="alert" class="alert shadow-lg animate-fade-in-up max-w-sm border"
             [ngClass]="{
               'toast-success': toast.type === 'success',
               'toast-error': toast.type === 'error',
               'toast-info': toast.type === 'info',
               'toast-warn': toast.type === 'warning'
             }">
          <lucide-icon [name]="getIcon(toast.type)" [size]="18"></lucide-icon>
          <span class="font-medium text-sm">{{ toast.message }}</span>
          <button (click)="toastService.remove(toast.id)" class="btn btn-ghost btn-xs btn-circle opacity-60 hover:opacity-100">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in-up {
      animation: fadeInUp 0.3s ease-out forwards;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Base: fondo del tema activo, siempre se adapta a light/dark */
    :host .alert {
      background-color: var(--color-base-100, white);
    }

    :host .toast-success {
      border-color: var(--color-success, oklch(0.723 0.219 149.579));
      color: var(--color-success, oklch(0.723 0.219 149.579));
    }
    :host .toast-error {
      border-color: var(--color-error, oklch(0.637 0.237 25.331));
      color: var(--color-error, oklch(0.637 0.237 25.331));
    }
    :host .toast-info {
      border-color: var(--color-info, oklch(0.72 0.191 231.6));
      color: var(--color-info, oklch(0.72 0.191 231.6));
    }
    :host .toast-warn {
      border-color: var(--color-warning, oklch(0.8 0.194 70.08));
      color: var(--color-warning, oklch(0.8 0.194 70.08));
    }

    /* El texto del mensaje hereda el color del base-content para máxima legibilidad */
    :host .alert span {
      color: var(--color-base-content);
    }
  `]
})
export class ToastContainerComponent {
  public toastService = inject(ToastService);

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  }
}
