// src/app/features/dashboard/components/evaluar-solicitud-modal/evaluar-solicitud-modal.component.ts

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SolicitudPendiente, EvaluacionCredito, Credito } from '../../../../core/models/credito.model';
import { CreditoService } from '../../../../core/services/credito.service';
import { ContratoPdfService } from '../../../../core/services/contrato-pdf.service';

@Component({
  selector: 'app-evaluar-solicitud-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluar-solicitud-modal.component.html',
  styleUrl: './evaluar-solicitud-modal.component.css'
})
export class EvaluarSolicitudModalComponent implements OnInit {
  @Input() solicitud!: SolicitudPendiente;
  @Output() cerrar = new EventEmitter<void>();
  @Output() evaluacionCompletada = new EventEmitter<void>();

  evaluacionForm!: FormGroup;
  enviando = false;
  error = '';
  exito = false;
  requisitosActuales: string[] = [];

  constructor(
    private fb: FormBuilder,
    private creditoService: CreditoService,
    private pdfService: ContratoPdfService
  ) {}

  ngOnInit(): void {
    // Inicializar con valores básicos de la solicitud
    this.evaluacionForm = this.fb.group({
      estadoAprobacion: [this.solicitud.estado || 'EN_EVALUACION', Validators.required],
      observaciones: ['', Validators.required],
      montoAprobado: [this.solicitud.montoSolicitado, [Validators.required, Validators.min(1)]],
      plazoMeses: [12, [Validators.required, Validators.min(1), Validators.max(120)]],
      tasaAprobada: [5.0, [Validators.required, Validators.min(0.01)]],
      nuevoRequisito: ['']
    });

    // Cargar detalles reales del crédito para obtener la tasa y el plazo original solicitado
    this.creditoService.obtenerCreditoPorIdAdmin(this.solicitud.creditoId).subscribe({
      next: (credito) => {
        if (credito) {
          this.evaluacionForm.patchValue({
            plazoMeses: credito.plazoMeses || 12,
            tasaAprobada: credito.tem || credito.tasaAprobada || 5.0
          });
        }
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const f = this.evaluacionForm.get(field);
    return !!f && f.invalid && (f.dirty || f.touched);
  }

  agregarRequisito(): void {
    const reqForm = this.evaluacionForm.get('nuevoRequisito');
    if (reqForm?.value && reqForm.value.trim() !== '') {
      this.requisitosActuales.push(reqForm.value.trim());
      reqForm.setValue('');
    }
  }

  quitarRequisito(index: number): void {
    this.requisitosActuales.splice(index, 1);
  }

  estadoSeleccionado(): string {
    return this.evaluacionForm.get('estadoAprobacion')?.value;
  }

  guardarEvaluacion(): void {
    if (this.evaluacionForm.invalid) {
      this.evaluacionForm.markAllAsTouched();
      return;
    }

    this.enviando = true;
    this.error = '';

    const evaluacion: EvaluacionCredito = {
      estadoAprobacion: this.estadoSeleccionado() as any,
      observaciones: this.evaluacionForm.get('observaciones')?.value,
      montoAprobado: this.evaluacionForm.get('montoAprobado')?.value,
      plazoMeses: this.evaluacionForm.get('plazoMeses')?.value,
      tasaAprobada: this.evaluacionForm.get('tasaAprobada')?.value,
      requisitos: this.requisitosActuales.length > 0 ? this.requisitosActuales : undefined
    };

    this.creditoService.evaluarSolicitud(this.solicitud.creditoId, evaluacion).subscribe({
      next: () => {
        this.exito = true;
        this.enviando = false;
        setTimeout(() => {
          this.evaluacionCompletada.emit();
        }, 1500);
      },
      error: (err) => {
        this.enviando = false;
        this.error = err.error?.mensaje || 'Error al guardar la evaluación';
      }
    });
  }

  previsualizarContrato(): void {
    this.enviando = true;
    this.creditoService.obtenerCarteraGeneral().subscribe({
      next: (creditos) => {
        const creditoCompleto = creditos.find(c => c.id === this.solicitud.creditoId);
        if (!creditoCompleto) {
          this.enviando = false;
          this.error = 'No se encontró el crédito en el sistema.';
          return;
        }

        // Inyectamos los valores del formulario para la previsualización
        const previewData: Credito = {
          ...creditoCompleto,
          montoAprobado: this.evaluacionForm.get('montoAprobado')?.value,
          plazoMeses: this.evaluacionForm.get('plazoMeses')?.value,
          tem: this.evaluacionForm.get('tasaAprobada')?.value
        };
        
        this.pdfService.descargarPDF(previewData).then(() => {
          this.enviando = false;
        }).catch(err => {
          this.enviando = false;
          alert('Error al generar previsualización');
        });
      },
      error: (err) => {
        this.enviando = false;
        this.error = 'No se pudieron cargar los datos completos para la previsualización.';
      }
    });
  }
}
