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
        <div class="alert shadow-lg border-none animate-fade-in-up" 
             [ngClass]="{
               'alert-success bg-success text-success-content': toast.type === 'success',
               'alert-error bg-error text-error-content': toast.type === 'error',
               'alert-info bg-info text-info-content': toast.type === 'info',
               'alert-warning bg-warning text-warning-content': toast.type === 'warning'
             }">
          <lucide-icon [name]="getIcon(toast.type)" [size]="20"></lucide-icon>
          <span class="font-medium text-sm">{{ toast.message }}</span>
          <button (click)="toastService.remove(toast.id)" class="btn btn-ghost btn-xs btn-circle">✕</button>
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
