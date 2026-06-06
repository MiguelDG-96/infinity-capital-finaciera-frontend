// src/app/features/dashboard/pages/admin-cartera/admin-cartera.component.ts

import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditoService } from '../../../../core/services/credito.service';
import { Credito } from '../../../../core/models/credito.model';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { ResolverContratoModalComponent } from '../../components/resolver-contrato-modal/resolver-contrato-modal.component';
import { FormsModule } from '@angular/forms';
import { ClientePerfilModalComponent } from '../../components/cliente-perfil-modal/cliente-perfil-modal.component';
import { FormalizacionModalComponent } from '../../components/formalizacion-modal/formalizacion-modal.component';
import { EditCreditoModalComponent } from '../../components/edit-credito-modal/edit-credito-modal.component';
import { EstadoCuentaModalComponent } from '../../components/estado-cuenta-modal/estado-cuenta-modal.component';

@Component({
  selector: 'app-admin-cartera',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, ResolverContratoModalComponent, FormsModule, ClientePerfilModalComponent, FormalizacionModalComponent, EditCreditoModalComponent, EstadoCuentaModalComponent],
  templateUrl: './admin-cartera.component.html',
  styleUrl: './admin-cartera.component.css'
})
export class AdminCarteraComponent implements OnInit {
  creditos: Credito[] = [];
  cargando = true;
  error = '';

  searchTerm = '';
  paginaActual = 1;
  registrosPorPagina = 10;

  get totalPaginas(): number {
    return Math.ceil(this.creditosFiltrados.length / this.registrosPorPagina) || 1;
  }

  get creditosFiltrados(): Credito[] {
    if (!this.searchTerm.trim()) {
      return this.creditos;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.creditos.filter(c => {
      const nombre = (c.nombreCliente || '').toLowerCase();
      const documento = (c.documento || '').toLowerCase();
      const monto = (c.montoAprobado || c.montoCredito || 0).toString();
      return nombre.includes(term) || documento.includes(term) || monto.includes(term);
    });
  }

  get creditosPaginados(): Credito[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.creditosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // Metricas
  totalCartera = 0;
  totalActivos = 0;
  totalAtrasados = 0;

  // Reporte de Caja
  reporteCaja: any = null;

  procesando = false;
  mostrarModalResolver = false;
  creditoSeleccionado: Credito | null = null;

  // Variables para el modal de desembolso
  showDesembolsoModal = false;
  creditoADesembolsar: number | null = null;
  desembolsoExitoso = false;

  // Variables para el modal de edición de cliente
  mostrarModalClientePerfil = false;
  clienteSeleccionadoId = signal<number>(0);
  clienteSeleccionado: any = null;

  // Nuevos modales
  mostrarModalFormalizacion = signal<boolean>(false);
  mostrarModalEditCredito = signal<boolean>(false);
  mostrarModalEstadoCuenta = signal<boolean>(false);

  constructor(
    private creditoService: CreditoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCartera();
  }

  cargarCartera(): void {
    this.cargando = true;
    this.creditoService.obtenerCarteraGeneral().subscribe({
      next: (data) => {
        this.creditos = data;
        this.paginaActual = 1;
        this.calcularMetricas(data);
        this.cargarReporteCaja();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar la cartera general.';
        this.cargando = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  calcularMetricas(data: Credito[]): void {
    this.totalCartera = data.reduce((sum, c) => sum + (c.montoAprobado || c.montoCredito), 0);
    this.totalActivos = data.filter(c => c.estado === 'ACTIVO').length;
    this.totalAtrasados = data.filter(c => c.estado === 'ATRASADO' || c.estado === 'MORA').reduce((sum, c) => sum + c.debeActualidad, 0);
  }

  cargarReporteCaja(): void {
    this.creditoService.obtenerReporteCaja().subscribe({
      next: (res) => {
        this.reporteCaja = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando reporte de caja:', err)
    });
  }

  iniciarDesembolso(id: number): void {
    if (this.procesando) return;
    this.creditoADesembolsar = id;
    this.showDesembolsoModal = true;
  }

  cancelarDesembolso(): void {
    this.showDesembolsoModal = false;
    this.creditoADesembolsar = null;
  }

  confirmarDesembolso(): void {
    if (!this.creditoADesembolsar || this.procesando) return;
    this.procesando = true;
    
    this.creditoService.desembolsarCredito(this.creditoADesembolsar).subscribe({
      next: () => {
        this.procesando = false;
        this.showDesembolsoModal = false;
        this.creditoADesembolsar = null;
        this.cargarCartera();
        this.desembolsoExitoso = true;
      },
      error: (err) => {
        this.procesando = false;
        this.showDesembolsoModal = false;
        this.creditoADesembolsar = null;
        alert(err.error?.mensaje || 'Error al desembolsar');
      }
    });
  }

  resolverContrato(credito: Credito): void {
    this.creditoSeleccionado = credito;
    this.mostrarModalResolver = true;
  }

  handleResolucionConfirmada(): void {
    this.mostrarModalResolver = false;
    this.cargarCartera();
  }

  abrirEditarCliente(clienteId: number): void {
    if (!clienteId) return;
    const credito = this.creditos.find(c => c.cliente?.id === clienteId);
    if (credito && credito.cliente) {
      this.clienteSeleccionado = credito.cliente;
      this.mostrarModalClientePerfil = true;
    }
  }

  handleClienteActualizado(): void {
    this.mostrarModalClientePerfil = false;
    this.cargarCartera();
  }

  abrirFormalizacion(c: Credito) {
    this.creditoSeleccionado = c;
    this.mostrarModalFormalizacion.set(true);
  }

  abrirMaestro(c: Credito) {
    this.creditoSeleccionado = c;
    this.mostrarModalEditCredito.set(true);
  }

  handleFormalizacionExito() {
    this.mostrarModalFormalizacion.set(false);
    this.cargarCartera();
  }

  handleEditCreditoExito() {
    this.mostrarModalEditCredito.set(false);
    this.cargarCartera();
  }

  abrirEstadoCuenta(c: Credito) {
    this.creditoSeleccionado = c;
    this.mostrarModalEstadoCuenta.set(true);
  }

  getEstadoClase(estado: string): string {
    switch(estado) {
      case 'APROBADO': return 'badge-success text-success-content';
      case 'ACTIVO': return 'badge-primary text-primary-content';
      case 'RECHAZADO': return 'badge-error text-error-content';
      case 'ATRASADO': return 'badge-error badge-outline';
      case 'MORA': return 'badge-error bg-error text-white';
      case 'EN_EVALUACION': return 'badge-warning text-warning-content';
      case 'EN_REVISION_HISTORIAL': return 'badge-info bg-info/20 text-info';
      case 'PENDIENTE_REQUISITOS': return 'badge-accent bg-accent/20 text-accent';
      case 'SOLICITADO': return 'badge-info text-info-content';
      case 'PAGADO': return 'badge-neutral';
      case 'RESUELTO': return 'badge-ghost opacity-50';
      default: return 'badge-ghost';
    }
  }
}
