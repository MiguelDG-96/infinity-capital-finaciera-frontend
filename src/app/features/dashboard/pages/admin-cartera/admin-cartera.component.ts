// src/app/features/dashboard/pages/admin-cartera/admin-cartera.component.ts

import { Component, OnInit, ChangeDetectorRef, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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

  // Toolbar state
  searchTerm = '';
  sortAscending = true;
  filtroAbierto = false;
  tiposFiltro: string[] = [];
  tiposSeleccionados: Set<string> = new Set();
  estadosFiltro: string[] = [];
  estadosSeleccionados: Set<string> = new Set();

  paginaActual = 1;
  registrosPorPagina = 10;

  get totalPaginas(): number {
    return Math.ceil(this.creditosFiltrados.length / this.registrosPorPagina) || 1;
  }

  get creditosFiltrados(): Credito[] {
    let list = [...this.creditos];

    // Búsqueda
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      list = list.filter(c => {
        const nombre = (c.nombreCliente || '').toLowerCase();
        const documento = (c.documento || '').toLowerCase();
        const monto = (c.montoAprobado || c.montoCredito || 0).toString();
        return nombre.includes(term) || documento.includes(term) || monto.includes(term);
      });
    }

    // Filtro por tipo de tasa
    if (this.tiposSeleccionados.size > 0) {
      list = list.filter(c => this.tiposSeleccionados.has(c.tipoCredito || ''));
    }

    // Filtro por estado
    if (this.estadosSeleccionados.size > 0) {
      list = list.filter(c => this.estadosSeleccionados.has(c.estado || ''));
    }

    // Ordenar por fecha de solicitud (todos los créditos siempre la tienen)
    list.sort((a, b) => {
      const da = new Date(a.fechaSolicitud || 0).getTime();
      const db = new Date(b.fechaSolicitud || 0).getTime();
      return this.sortAscending ? da - db : db - da;
    });

    return list;
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

  toggleSort(): void {
    this.sortAscending = !this.sortAscending;
    this.paginaActual = 1;
  }

  toggleFiltro(event: MouseEvent): void {
    event.stopPropagation();
    this.filtroAbierto = !this.filtroAbierto;
  }

  toggleTipo(tipo: string): void {
    const next = new Set(this.tiposSeleccionados);
    if (next.has(tipo)) {
      next.delete(tipo);
    } else {
      next.add(tipo);
    }
    this.tiposSeleccionados = next;
    sessionStorage.setItem('carteraTiposFiltro', JSON.stringify(Array.from(this.tiposSeleccionados)));
    this.paginaActual = 1;
  }

  toggleEstado(estado: string): void {
    const next = new Set(this.estadosSeleccionados);
    if (next.has(estado)) {
      next.delete(estado);
    } else {
      next.add(estado);
    }
    this.estadosSeleccionados = next;
    sessionStorage.setItem('carteraEstadosFiltro', JSON.stringify(Array.from(this.estadosSeleccionados)));
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.tiposSeleccionados = new Set();
    this.estadosSeleccionados = new Set();
    sessionStorage.removeItem('carteraTiposFiltro');
    sessionStorage.removeItem('carteraEstadosFiltro');
    this.paginaActual = 1;
    this.filtroAbierto = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.filtroAbierto = false;
  }

  // Metricas
  totalCartera = 0;
  totalActivos = 0;
  totalAtrasados = 0;
  totalPagadoCartera = 0;

  // Reporte de Caja
  reporteCaja: any = null;

  procesando = false;
  mostrarModalResolver = false;
  creditoSeleccionado: Credito | null = null;

  showDesembolsoModal = false;
  creditoADesembolsar: number | null = null;
  desembolsoExitoso = false;

  mostrarModalClientePerfil = false;
  clienteSeleccionadoId = signal<number>(0);
  clienteSeleccionado: any = null;

  mostrarModalFormalizacion = signal<boolean>(false);
  mostrarModalEditCredito = signal<boolean>(false);
  mostrarModalEstadoCuenta = signal<boolean>(false);

  constructor(
    private creditoService: CreditoService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    const savedSearch = sessionStorage.getItem('carteraSearchTerm');
    if (savedSearch) {
      this.searchTerm = savedSearch;
    }
    const savedTipos = sessionStorage.getItem('carteraTiposFiltro');
    if (savedTipos) {
      try {
        this.tiposSeleccionados = new Set(JSON.parse(savedTipos));
      } catch (e) {}
    }
    const savedEstados = sessionStorage.getItem('carteraEstadosFiltro');
    if (savedEstados) {
      try {
        this.estadosSeleccionados = new Set(JSON.parse(savedEstados));
      } catch (e) {}
    }
    this.cargarCartera();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    sessionStorage.setItem('carteraSearchTerm', term);
    this.paginaActual = 1;
  }

  clearSearch(): void {
    this.searchTerm = '';
    sessionStorage.removeItem('carteraSearchTerm');
    this.paginaActual = 1;
  }

  limpiarTodosLosFiltros(): void {
    this.searchTerm = '';
    sessionStorage.removeItem('carteraSearchTerm');
    this.tiposSeleccionados = new Set();
    this.estadosSeleccionados = new Set();
    sessionStorage.removeItem('carteraTiposFiltro');
    sessionStorage.removeItem('carteraEstadosFiltro');
    this.paginaActual = 1;
  }

  cargarCartera(): void {
    this.cargando = true;
    this.creditoService.obtenerCarteraGeneral().subscribe({
      next: (data) => {
        this.creditos = data;
        this.paginaActual = 1;
        this.calcularMetricas(data);
        this.cargarReporteCaja();
        this.tiposFiltro = [...new Set(data.map(c => c.tipoCredito || '').filter(t => t))].sort();
        this.estadosFiltro = [...new Set(data.map(c => c.estado || '').filter(e => e))].sort();
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
    this.totalPagadoCartera = data.reduce((sum, c) => sum + this.getMontoPagado(c), 0);
  }

  getMontoPagado(c: Credito): number {
    if (c.cuotas && c.cuotas.length > 0) {
      return c.cuotas.reduce((sum, cuota) => {
        if (cuota.estadoCuota === 'PAGADO') return sum + cuota.totalCuota;
        if (cuota.estadoCuota === 'PAGADO_PARCIAL' && cuota.montoPagadoCliente) return sum + cuota.montoPagadoCliente;
        return sum;
      }, 0);
    }
    // Fallback if cuotas are not available
    return Math.max(0, (c.montoTotal || c.montoCredito || 0) - (c.debeActualidad || 0));
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

  irADetalle(id: number) {
    this.router.navigate(['/dashboard/admin/cartera', id]);
  }

  getTipoCreditoBadge(c: Credito): { clase: string; icon: string } {
    if (c.iconoTipoCredito) {
      return { clase: 'bg-primary/10 text-primary border-primary/20', icon: c.iconoTipoCredito };
    }
    const t = (c.tipoCredito || '').toLowerCase();
    if (t.includes('efectivo') || t.includes('personal')) {
      return { clase: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25', icon: 'banknote' };
    } else if (t.includes('vehicul')) {
      return { clase: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25', icon: 'truck' };
    } else if (t.includes('estudi') || t.includes('educac')) {
      return { clase: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25', icon: 'graduation-cap' };
    } else if (t.includes('negocio') || t.includes('empresa') || t.includes('comerci')) {
      return { clase: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25', icon: 'briefcase' };
    } else if (t.includes('hipotec') || t.includes('inmueble') || t.includes('viviend')) {
      return { clase: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25', icon: 'home' };
    } else if (t.includes('consume') || t.includes('compra')) {
      return { clase: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/25', icon: 'shopping-cart' };
    } else {
      return { clase: 'bg-base-300 text-base-content/60 border border-base-content/15', icon: 'coins' };
    }
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
