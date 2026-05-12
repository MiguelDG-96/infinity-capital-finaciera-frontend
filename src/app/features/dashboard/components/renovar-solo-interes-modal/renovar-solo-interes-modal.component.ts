// src/app/features/dashboard/components/renovar-solo-interes-modal/renovar-solo-interes-modal.component.ts

import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Cuota } from '../../../../core/models/credito.model';
import { CreditoService } from '../../../../core/services/credito.service';

@Component({
  selector: 'app-renovar-solo-interes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './renovar-solo-interes-modal.component.html'
})
export class RenovarSoloInteresModalComponent {
  @Input() cuota!: Cuota;
  @Output() cerrar = new EventEmitter<void>();
  @Output() exito = new EventEmitter<void>();

  private creditoService = inject(CreditoService);

  enviando = signal(false);
  error = signal<string | null>(null);
  pasoExito = signal(false);

  metodoPago = 'EFECTIVO';
  numeroComprobante = 'REN-' + Date.now().toString().slice(-6);

  confirmar() {
    this.enviando.set(true);
    this.error.set(null);

    const payload = {
      metodoPago: this.metodoPago,
      numeroComprobante: this.numeroComprobante
    };

    this.creditoService.renovarSoloInteres(this.cuota.id, payload).subscribe({
      next: () => {
        this.pasoExito.set(true);
        this.enviando.set(false);
        setTimeout(() => {
          this.exito.emit();
        }, 2000);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err.error?.error || 'Error al procesar la renovación');
      }
    });
  }
}
