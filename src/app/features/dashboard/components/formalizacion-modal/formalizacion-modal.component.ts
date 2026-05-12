// src/app/features/dashboard/components/formalizacion-modal/formalizacion-modal.component.ts

import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Credito } from '../../../../core/models/credito.model';
import { CreditoService } from '../../../../core/services/credito.service';

@Component({
  selector: 'app-formalizacion-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './formalizacion-modal.component.html'
})
export class FormalizacionModalComponent implements OnInit {
  @Input() credito!: Credito;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardadoExitoso = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private creditoService = inject(CreditoService);

  form!: FormGroup;
  enviando = signal(false);
  error = signal<string | null>(null);
  exito = signal(false);

  ngOnInit() {
    this.form = this.fb.group({
      montoAprobado: [this.credito.montoAprobado || this.credito.montoCredito, [Validators.required, Validators.min(1)]],
      plazoMeses: [this.credito.plazoMeses, [Validators.required, Validators.min(1)]],
      tasaAprobada: [this.credito.tasaAprobada || this.credito.tem || 0, [Validators.required, Validators.min(0)]],
      contactoFamiliarNombre: ['', [Validators.required]],
      contactoFamiliarCelular: ['', [Validators.required]],
      direccionActual: [this.credito.cliente?.domicilio || '', [Validators.required]],
      viveCasaPropia: [true],
      direccionTrabajo: ['', [Validators.required]],
      referenciaTrabajo: ['', [Validators.required]],
      numeroDocumento: [this.credito.cliente?.numeroDocumento || '', [Validators.required]],
      aceptaTasa: [true],
      aceptaContrato: [true],
      formaPago: ['TRANSFERENCIA'],
      garantia: ['']
    });
  }

  isFieldInvalid(field: string): boolean {
    const f = this.form.get(field);
    return !!f && f.invalid && (f.dirty || f.touched);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    this.creditoService.formalizarRevisionOficina(this.credito.id, this.form.value).subscribe({
      next: () => {
        this.exito.set(true);
        this.enviando.set(false);
        setTimeout(() => {
          this.guardadoExitoso.emit();
        }, 2000);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err.error?.mensaje || 'Error al guardar la formalización');
      }
    });
  }
}
