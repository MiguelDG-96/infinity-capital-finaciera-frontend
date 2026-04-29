// src/app/features/dashboard/components/resolver-contrato-modal/resolver-contrato-modal.component.ts

import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Credito } from '../../../../core/models/credito.model';
import { CreditoService } from '../../../../core/services/credito.service';

@Component({
  selector: 'app-resolver-contrato-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './resolver-contrato-modal.component.html'
})
export class ResolverContratoModalComponent {
  @Input() credito!: Credito;
  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmado = new EventEmitter<void>();

  resolverForm: FormGroup;
  enviando = signal(false);
  error = signal<string | null>(null);
  exito = signal(false);

  constructor(
    private fb: FormBuilder,
    private creditoService: CreditoService
  ) {
    this.resolverForm = this.fb.group({
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  isFieldInvalid(field: string): boolean {
    const f = this.resolverForm.get(field);
    return !!f && f.invalid && (f.dirty || f.touched);
  }

  confirmarResolucion(): void {
    if (this.resolverForm.invalid) {
      this.resolverForm.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const { motivo } = this.resolverForm.value;

    this.creditoService.resolverContrato(this.credito.id, motivo).subscribe({
      next: () => {
        this.exito.set(true);
        this.enviando.set(false);
        setTimeout(() => {
          this.confirmado.emit();
        }, 2000);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err.error?.mensaje || 'Error al resolver el contrato');
      }
    });
  }
}
