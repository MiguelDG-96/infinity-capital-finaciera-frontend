import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CreditoService } from '../../../../core/services/credito.service';
import { Garante } from '../../../../core/models/credito.model';

@Component({
  selector: 'app-garante-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './garante-modal.component.html'
})
export class GaranteModalComponent {
  private fb = inject(FormBuilder);
  private creditoService = inject(CreditoService);

  @Input({ required: true }) creditoId!: number;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardadoExitoso = new EventEmitter<void>();

  procesando = signal<boolean>(false);
  error = signal<string | null>(null);

  garanteForm = this.fb.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(5)]],
    tipoDocumento: ['DNI', Validators.required],
    numeroDocumento: ['', [Validators.required, Validators.minLength(8)]],
    direccion: ['', Validators.required],
    telefono: ['', [Validators.required, Validators.minLength(9)]],
    relacion: ['', Validators.required]
  });

  onSubmit() {
    if (this.garanteForm.invalid || this.procesando()) return;

    this.procesando.set(true);
    this.error.set(null);

    const garante: Garante = this.garanteForm.value as Garante;

    this.creditoService.agregarGarante(this.creditoId, garante).subscribe({
      next: () => {
        this.procesando.set(false);
        this.guardadoExitoso.emit();
      },
      error: (err) => {
        this.procesando.set(false);
        this.error.set(err.error?.mensaje || 'Error al guardar el garante');
      }
    });
  }
}
