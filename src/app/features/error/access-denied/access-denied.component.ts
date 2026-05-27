import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-base-100 flex flex-col items-center justify-center p-4">
      <div class="max-w-md w-full bg-base-200/50 p-8 rounded-2xl border border-error/20 text-center shadow-xl">
        <div class="mx-auto w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-6">
          <lucide-icon name="shield-alert" size="40"></lucide-icon>
        </div>
        
        <h1 class="text-3xl font-black text-base-content mb-2 tracking-tight">Acceso Denegado</h1>
        <h2 class="text-xl font-bold text-error mb-6">IP Bloqueada</h2>
        
        <p class="text-base-content/70 mb-8 leading-relaxed">
          Por motivos de seguridad, tu dirección IP ha sido bloqueada temporalmente debido a actividad inusual o intentos repetidos de acceso no autorizado.
        </p>

        <div class="bg-base-100 p-4 rounded-xl border border-base-content/10 text-sm font-medium text-base-content/80 mb-8">
          Si crees que esto es un error, por favor contacta al equipo de soporte de Infinity Capital.
        </div>
        
        <button 
          routerLink="/login"
          class="btn btn-outline btn-error w-full font-bold tracking-widest"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class AccessDeniedComponent {
}
