// src/app/features/dashboard/components/postergar-cuota-modal/postergar-cuota-modal.component.ts

import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Cuota } from '../../../../core/models/credito.model';
import { CreditoService } from '../../../../core/services/credito.service';

@Component({
  selector: 'app-postergar-cuota-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './postergar-cuota-modal.component.html'
})
export class PostergarCuotaModalComponent {
  @Input() cuota!: Cuota;
  @Output() cerrar = new EventEmitter<void>();
  @Output() postergadoExitoso = new EventEmitter<void>();

  enviando = signal<boolean>(false);
  exito = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private creditoService: CreditoService) {}

  confirmarPostergar() {
    this.enviando.set(true);
    this.error.set(null);

    this.creditoService.postergarCuota(this.cuota.id).subscribe({
      next: (resp) => {
        this.enviando.set(false);
        this.exito.set(true);
        setTimeout(() => {
          this.postergadoExitoso.emit();
        }, 2000);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err.error?.mensaje || 'Error al postergar la cuota');
      }
    });
  }
}
