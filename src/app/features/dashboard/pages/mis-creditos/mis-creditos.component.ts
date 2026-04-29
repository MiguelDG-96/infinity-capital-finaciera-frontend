// src/app/features/dashboard/pages/mis-creditos/mis-creditos.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CreditoService } from '../../../../core/services/credito.service';
import { Credito } from '../../../../core/models/credito.model';
import { ContratoPdfService } from '../../../../core/services/contrato-pdf.service';

@Component({
  selector: 'app-mis-creditos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-creditos.component.html',
  styleUrl: './mis-creditos.component.css' // We won't need much CSS since we use Tailwind natively
})
export class MisCreditosComponent implements OnInit {
  creditos: Credito[] = [];
  cargando = true;
  error = '';

  constructor(
    private creditoService: CreditoService,
    private pdfService: ContratoPdfService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCreditos();
  }

  cargarCreditos(): void {
    this.cargando = true;
    this.creditoService.obtenerMisCreditos().subscribe({
      next: (data) => {
        this.creditos = data;
        this.cargando = false;
        this.cdr.detectChanges(); // Forzamos a Angular a repintar la pantalla
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los créditos. Por favor intenta más tarde.';
        this.cargando = false;
        this.cdr.detectChanges(); // Forzamos a Angular a repintar la pantalla
        console.error(err);
      }
    });
  }

  getEstadoClase(estado: string): string {
    switch(estado) {
      case 'APROBADO':
      case 'ACTIVO':
        return 'badge-success text-success-content';
      case 'RECHAZADO':
      case 'MORA':
        return 'badge-error text-error-content';
      case 'EN_EVALUACION':
        return 'badge-warning text-warning-content';
      case 'SOLICITADO':
        return 'badge-info text-info-content';
      default:
        return 'badge-ghost';
    }
  }

  getProgresoPagos(credito: Credito): number {
    const pagadas = credito.cuotas.filter(c => c.estadoCuota === 'PAGADO').length;
    return (pagadas / credito.cuotas.length) * 100;
  }

  descargarContrato(credito: Credito, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.pdfService.descargarPDF(credito).catch(err => {
      console.error('Error al generar PDF:', err);
      alert('Error al generar el contrato PDF.');
    });
  }
}
