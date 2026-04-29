// src/app/features/dashboard/pages/solicitar-credito/solicitar-credito.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CreditoService } from '../../../../core/services/credito.service';
import { SolicitudCredito } from '../../../../core/models/credito.model';

@Component({
  selector: 'app-solicitar-credito',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink],
  templateUrl: './solicitar-credito.component.html',
  styleUrl: './solicitar-credito.component.css'
})
export class SolicitarCreditoComponent implements OnInit {
  solicitudForm!: FormGroup;
  enviando = false;
  error = '';
  exito = false;

  // Catalog data
  tiposDocumento = ['DNI', 'CARNET_EXTRANJERIA', 'PASAPORTE'];
  tiposCredito: { id: number, nombre: string, temDefecto: number }[] = [];
  monedas: { id: number, nombre: string, simbolo: string }[] = [];
  cargandoCatalogo = true;

  cuotaEstimada = 0;
  temSeleccionada = 0;

  constructor(
    private fb: FormBuilder,
    private creditoService: CreditoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.solicitudForm = this.fb.group({
      tipoDocumento: ['DNI', [Validators.required]],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.minLength(8)]],
      domicilio: ['', [Validators.required, Validators.minLength(5)]],
      tipoCreditoId: ['', [Validators.required]],
      monedaId: ['', [Validators.required]],
      montoSolicitado: [1000, [Validators.required, Validators.min(100), Validators.max(500000)]],
      plazoMeses: [12, [Validators.required, Validators.min(1), Validators.max(60)]]
    });

    this.cargarCatalogos();

    // Recalcular cuota cuando cambien valores relevantes
    this.solicitudForm.valueChanges.subscribe(() => {
      this.calcularCuota();
    });
  }

  cargarCatalogos(): void {
    this.creditoService.obtenerMonedasActivas().subscribe({
      next: (data) => {
        this.monedas = data;
        if (data.length > 0) {
          this.solicitudForm.patchValue({ monedaId: data[0].id }, { emitEvent: false });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando monedas', err);
        this.cdr.detectChanges();
      }
    });
    
    this.creditoService.obtenerTiposCreditoActivos().subscribe({
      next: (data) => {
        this.tiposCredito = data as any[];
        if (data.length > 0) {
          this.solicitudForm.patchValue({ tipoCreditoId: data[0].id }, { emitEvent: false });
          this.calcularCuota();
        }
        this.cargandoCatalogo = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando tipos de créditos', err);
        this.cargandoCatalogo = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularCuota(): void {
    const { montoSolicitado, plazoMeses, tipoCreditoId } = this.solicitudForm.value;
    const tipo = this.tiposCredito.find(t => t.id == tipoCreditoId);
    
    if (tipo && montoSolicitado > 0 && plazoMeses > 0) {
      this.temSeleccionada = tipo.temDefecto || 0;
      const i = this.temSeleccionada / 100;
      
      if (i === 0) {
        this.cuotaEstimada = montoSolicitado / plazoMeses;
      } else {
        // Fórmula Sistema Francés: R = P * [i(1+i)^n] / [(1+i)^n - 1]
        const factor = Math.pow(1 + i, plazoMeses);
        this.cuotaEstimada = montoSolicitado * (i * factor) / (factor - 1);
      }
    }
    // Forzamos actualización visual del simulador lateral
    this.cdr.detectChanges();
  }

  isFieldInvalid(field: string): boolean {
    const f = this.solicitudForm.get(field);
    return !!f && f.invalid && (f.dirty || f.touched);
  }

  onSubmit(): void {
    if (this.solicitudForm.invalid) {
      this.solicitudForm.markAllAsTouched();
      return;
    }

    this.enviando = true;
    this.error = '';

    const solicitud: SolicitudCredito = this.solicitudForm.value;

    this.creditoService.solicitarCredito(solicitud).subscribe({
      next: (res) => {
        this.exito = true;
        this.enviando = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/dashboard/creditos/mis-creditos']);
        }, 3000);
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error al procesar la solicitud. Por favor intenta de nuevo.';
        this.enviando = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }
}
