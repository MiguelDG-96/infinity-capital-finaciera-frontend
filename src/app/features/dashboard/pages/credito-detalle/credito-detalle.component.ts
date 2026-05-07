// src/app/features/dashboard/pages/credito-detalle/credito-detalle.component.ts

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CreditoService } from '../../../../core/services/credito.service';
import { Credito, Cuota } from '../../../../core/models/credito.model';
import { ContratoPdfService } from '../../../../core/services/contrato-pdf.service';
import { PagoAnticipadoModalComponent } from '../../components/pago-anticipado-modal/pago-anticipado-modal.component';
import { GaranteModalComponent } from '../../components/garante-modal/garante-modal.component';
import { EditCuotaModalComponent } from '../../components/edit-cuota-modal/edit-cuota-modal.component';
import { EditCreditoModalComponent } from '../../components/edit-credito-modal/edit-credito-modal.component';
import { ClientePerfilModalComponent } from '../../components/cliente-perfil-modal/cliente-perfil-modal.component';

@Component({
  selector: 'app-credito-detalle',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, PagoAnticipadoModalComponent, GaranteModalComponent, EditCuotaModalComponent, EditCreditoModalComponent, ClientePerfilModalComponent],
  templateUrl: './credito-detalle.component.html',
  styleUrl: './credito-detalle.component.css'
})
export class CreditoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private creditoService = inject(CreditoService);
  private pdfService = inject(ContratoPdfService);

  credito = signal<Credito | null>(null);
  isAdminMode = signal<boolean>(false);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  procesando = signal<boolean>(false);
  descargando = signal<boolean>(false);
  mostrarModalPago = signal<boolean>(false);
  mostrarModalGarante = signal<boolean>(false);
  mostrarModalEditarCuota = signal<boolean>(false);
  mostrarModalEditarCredito = signal<boolean>(false);
  mostrarModalClientePerfil = signal<boolean>(false);
  cuotaSeleccionada = signal<Cuota | null>(null);

  // Paginación
  currentPage = signal<number>(1);
  pageSize = 10;

  paginatedCuotas = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.credito()?.cuotas.slice(start, end) || [];
  });

  totalPages = computed(() => {
    return Math.ceil((this.credito()?.cuotas.length || 0) / this.pageSize);
  });

  pagesArray = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  ngOnInit() {
    this.isAdminMode.set(this.route.snapshot.url.some(segment => segment.path === 'admin'));
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.cargarDetalle(id);
    }
  }

  cargarDetalle(id: number) {
    this.cargando.set(true);
    const obs = this.isAdminMode() 
      ? this.creditoService.obtenerCreditoPorIdAdmin(id)
      : this.creditoService.obtenerCreditoPorId(id);

    obs.subscribe({
      next: (c) => {
        this.credito.set(c);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el detalle del crédito.');
        this.cargando.set(false);
      }
    });
  }

  pagarCuota(cuota: Cuota) {
    if (cuota.estadoCuota === 'PAGADO' || this.procesando()) return;
    
    if (confirm(`¿Deseas pagar la cuota #${cuota.numeroCuota} por un total de S/ ${cuota.totalCuota}?`)) {
      this.procesando.set(true);
      this.creditoService.pagarCuota(cuota.id, cuota.totalCuota, 'SALDO_BILLETERA').subscribe({
        next: () => {
          this.procesando.set(false);
          this.cargarDetalle(this.credito()!.id);
        },
        error: (err) => {
          this.procesando.set(false);
          alert(err.error?.mensaje || 'Error al procesar el pago');
        }
      });
    }
  }

  pagoAnticipado() {
    this.mostrarModalPago.set(true);
  }

  handlePagoExitoso() {
    this.mostrarModalPago.set(false);
    this.cargarDetalle(this.credito()!.id);
  }

  handleGaranteGuardado() {
    this.mostrarModalGarante.set(false);
    this.cargarDetalle(this.credito()!.id);
  }

  abrirPerfilCliente() {
    this.mostrarModalClientePerfil.set(true);
  }

  handleFotoActualizada() {
    this.mostrarModalClientePerfil.set(false);
    this.cargarDetalle(this.credito()!.id);
  }

  descargarContrato() {
    const c = this.credito();
    if (!c || this.descargando()) return;
    
    this.descargando.set(true);
    this.pdfService.descargarPDF(c).then(() => {
        this.descargando.set(false);
    }).catch(err => {
        this.descargando.set(false);
        console.error('Error al generar PDF:', err);
        alert('Error al generar el contrato PDF. Por favor reintente.');
    });
  }

  postergarCuota(cuota: Cuota) {
    if (!this.isAdminMode() || this.procesando()) return;
    
    if (confirm(`¿Estás seguro de postergar la cuota #${cuota.numeroCuota}? Esto creará una nueva cuota al final del cronograma con los intereses correspondientes.`)) {
      this.procesando.set(true);
      this.creditoService.postergarCuota(cuota.id).subscribe({
        next: (resp) => {
          this.procesando.set(false);
          alert(resp.mensaje);
          this.cargarDetalle(this.credito()!.id);
        },
        error: (err) => {
          this.procesando.set(false);
          alert(err.error?.error || 'Error al postergar la cuota');
        }
      });
    }
  }

  abrirEditarCuota(cuota: Cuota) {
    this.cuotaSeleccionada.set(cuota);
    this.mostrarModalEditarCuota.set(true);
  }

  abrirEditarCredito() {
    this.mostrarModalEditarCredito.set(true);
  }

  desembolsar() {
    if (!this.isAdminMode() || this.procesando() || !this.credito()) return;
    
    if (confirm('¿Confirmas el desembolso de este crédito? Se generará el cronograma oficial.')) {
      this.procesando.set(true);
      this.creditoService.desembolsarCredito(this.credito()!.id).subscribe({
        next: (resp) => {
          this.procesando.set(false);
          alert(resp.mensaje);
          this.cargarDetalle(this.credito()!.id);
        },
        error: (err) => {
          this.procesando.set(false);
          alert(err.error?.mensaje || 'Error al procesar el desembolso');
        }
      });
    }
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getEstadoClase(estado: string): string {
    switch(estado) {
      case 'PAGADO': return 'badge-success text-success-content';
      case 'MORA': return 'badge-error text-error-content shadow-lg shadow-error/20';
      case 'PAGADO_PARCIAL': return 'badge-warning text-warning-content';
      case 'RESUELTO': return 'badge-neutral opacity-50';
      default: return 'badge-ghost opacity-60';
    }
  }
}
