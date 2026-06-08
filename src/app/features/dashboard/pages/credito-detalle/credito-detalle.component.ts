// src/app/features/dashboard/pages/credito-detalle/credito-detalle.component.ts

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CreditoService } from '../../../../core/services/credito.service';
import { Credito, Cuota } from '../../../../core/models/credito.model';
import { ContratoPdfService } from '../../../../core/services/contrato-pdf.service';
import { EstadoCuentaPdfService } from '../../../../core/services/estado-cuenta-pdf.service';
import { PagoAnticipadoModalComponent } from '../../components/pago-anticipado-modal/pago-anticipado-modal.component';
import { GaranteModalComponent } from '../../components/garante-modal/garante-modal.component';
import { EditCuotaModalComponent } from '../../components/edit-cuota-modal/edit-cuota-modal.component';
import { EditCreditoModalComponent } from '../../components/edit-credito-modal/edit-credito-modal.component';
import { ClientePerfilModalComponent } from '../../components/cliente-perfil-modal/cliente-perfil-modal.component';
import { PostergarCuotaModalComponent } from '../../components/postergar-cuota-modal/postergar-cuota-modal.component';
import { RenovarSoloInteresModalComponent } from '../../components/renovar-solo-interes-modal/renovar-solo-interes-modal.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-credito-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink, PagoAnticipadoModalComponent, GaranteModalComponent, EditCuotaModalComponent, EditCreditoModalComponent, ClientePerfilModalComponent, PostergarCuotaModalComponent, RenovarSoloInteresModalComponent],
  templateUrl: './credito-detalle.component.html',
  styleUrl: './credito-detalle.component.css'
})
export class CreditoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private creditoService = inject(CreditoService);
  private pdfService = inject(ContratoPdfService);
  private estadoCuentaPdfService = inject(EstadoCuentaPdfService);

  readonly baseUrl = environment.apiUrl.replace('/api/v1', '');

  credito = signal<Credito | null>(null);
  isAdminMode = signal<boolean>(false);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  procesando = signal<boolean>(false);
  descargando = signal<boolean>(false);
  descargandoEstadoCuenta = signal<boolean>(false);
  mostrarModalPago = signal<boolean>(false);
  mostrarModalGarante = signal<boolean>(false);
  mostrarModalEditarCuota = signal<boolean>(false);
  mostrarModalEditarCredito = signal<boolean>(false);
  mostrarModalClientePerfil = signal<boolean>(false);
  mostrarModalPostergar = signal<boolean>(false);
  mostrarModalRenovar = signal<boolean>(false);
  cuotaSeleccionada = signal<Cuota | null>(null);
  pagosRestringidos = signal<boolean>(false);
  mostrarModalRestriccion = signal<boolean>(false);
  isClienteRecurrente = signal<boolean>(false);
  mostrarInfoCredito = signal<boolean>(false);

  // --- Subir Comprobante (Cliente) ---
  mostrarModalSubirComprobante = signal<boolean>(false);
  subiendoComprobante = signal<boolean>(false);
  comprobantePreviewUrl = signal<string | null>(null);
  comprobanteArchivo: File | null = null;
  comprobanteForm = {
    monto: 0,
    metodoPago: 'YAPE',
    numeroComprobante: ''
  };

  // --- Revisar Comprobante (Admin) ---
  mostrarModalRevisarPago = signal<boolean>(false);
  mostrarModalConfirmarAprobacion = signal<boolean>(false);
  procesandoRevision = signal<boolean>(false);
  comentarioRechazoInput = signal<string>('');
  mostrarFormRechazo = signal<boolean>(false);
  urlComprobanteRevision = signal<string | null>(null);

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
        
        // Verificar si es cliente recurrente (más de un crédito)
        if (c.documento) {
          const obsCartera = this.isAdminMode() 
            ? this.creditoService.obtenerCarteraGeneral() 
            : this.creditoService.obtenerMisCreditos();
            
          obsCartera.subscribe({
            next: (cartera) => {
              const creditosDelCliente = cartera.filter(cred => cred.documento === c.documento);
              this.isClienteRecurrente.set(creditosDelCliente.length > 1);
            }
          });
        }
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

  // ============ SUBIR COMPROBANTE (Cliente) ============

  abrirSubirComprobante(cuota: Cuota) {
    this.cuotaSeleccionada.set(cuota);
    const totalConMora = (cuota.totalCuota || 0) + (cuota.interesMora || 0) + (cuota.penalidad || 0);
    this.comprobanteForm = {
      monto: totalConMora,
      metodoPago: 'YAPE',
      numeroComprobante: ''
    };
    this.comprobanteArchivo = null;
    this.comprobantePreviewUrl.set(null);
    this.mostrarModalSubirComprobante.set(true);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.comprobanteArchivo = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.comprobantePreviewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.comprobanteArchivo = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.comprobantePreviewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  enviarComprobante() {
    const cuota = this.cuotaSeleccionada();
    const esEfectivo = this.comprobanteForm.metodoPago === 'EFECTIVO';
    if (!cuota) {
      return;
    }
    if (!esEfectivo && !this.comprobanteArchivo) {
      alert('Por favor selecciona una imagen del comprobante.');
      return;
    }
    if (esEfectivo) {
      this.comprobanteForm.numeroComprobante = 'EFECTIVO-' + Date.now().toString().slice(-6);
    }
    
    if (!this.comprobanteForm.numeroComprobante.trim()) {
      alert('Por favor ingresa el número/código de operación.');
      return;
    }

    this.subiendoComprobante.set(true);
    this.creditoService.registrarPagoRevision(
      cuota.id,
      this.comprobanteForm.monto,
      this.comprobanteForm.metodoPago,
      this.comprobanteForm.numeroComprobante,
      this.comprobanteArchivo || new File([''], 'empty.txt', { type: 'text/plain' }) // Dummy file for FormData if needed, but backend takes required=false
    ).subscribe({
      next: (resp) => {
        this.subiendoComprobante.set(false);
        this.mostrarModalSubirComprobante.set(false);
        this.cargarDetalle(this.credito()!.id);
      },
      error: (err) => {
        this.subiendoComprobante.set(false);
        alert(err.error?.error || 'Error al enviar el comprobante. Por favor intente nuevamente.');
      }
    });
  }

  cerrarModalSubirComprobante() {
    this.mostrarModalSubirComprobante.set(false);
    this.comprobanteArchivo = null;
    this.comprobantePreviewUrl.set(null);
    this.mostrarFormRechazo.set(false);
    this.comentarioRechazoInput.set('');
  }

  // ============ REVISAR COMPROBANTE (Admin) ============

  abrirRevisarPago(cuota: Cuota) {
    this.cuotaSeleccionada.set(cuota);
    this.mostrarFormRechazo.set(false);
    this.comentarioRechazoInput.set('');
    const url = cuota.imagenComprobante ? `${this.baseUrl}${cuota.imagenComprobante}` : null;
    this.urlComprobanteRevision.set(url);
    this.mostrarModalRevisarPago.set(true);
  }

  aprobarComprobante() {
    this.mostrarModalConfirmarAprobacion.set(true);
  }

  ejecutarAprobacion() {
    const cuota = this.cuotaSeleccionada();
    if (!cuota) return;

    this.procesandoRevision.set(true);
    this.creditoService.verificarPago(cuota.id).subscribe({
      next: () => {
        this.procesandoRevision.set(false);
        this.mostrarModalConfirmarAprobacion.set(false);
        this.mostrarModalRevisarPago.set(false);
        this.cargarDetalle(this.credito()!.id);
      },
      error: (err) => {
        this.procesandoRevision.set(false);
        alert(err.error?.error || 'Error al aprobar el pago');
      }
    });
  }

  rechazarComprobante() {
    const cuota = this.cuotaSeleccionada();
    const comentario = this.comentarioRechazoInput().trim();
    if (!cuota || !comentario) {
      alert('Por favor ingresa el motivo del rechazo.');
      return;
    }

    this.procesandoRevision.set(true);
    this.creditoService.rechazarPago(cuota.id, comentario).subscribe({
      next: () => {
        this.procesandoRevision.set(false);
        this.mostrarModalRevisarPago.set(false);
        this.cargarDetalle(this.credito()!.id);
      },
      error: (err) => {
        this.procesandoRevision.set(false);
        alert(err.error?.error || 'Error al rechazar el pago');
      }
    });
  }

  cerrarModalRevisarPago() {
    this.mostrarModalRevisarPago.set(false);
    this.mostrarFormRechazo.set(false);
    this.comentarioRechazoInput.set('');
  }

  // ============ OTROS ============

  pagoAnticipado() {
    if (this.pagosRestringidos() && !this.isAdminMode()) {
      this.mostrarModalRestriccion.set(true);
      return;
    }
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
    this.pdfService.descargarPDF(c, this.isClienteRecurrente()).then(() => {
        this.descargando.set(false);
    }).catch(err => {
        this.descargando.set(false);
        console.error('Error al generar PDF:', err);
        alert('Error al generar el contrato PDF. Por favor reintente.');
    });
  }

  descargarEstadoCuenta() {
    const c = this.credito();
    if (!c || this.descargandoEstadoCuenta()) return;

    this.descargandoEstadoCuenta.set(true);
    // Asegurarse de enviar las cuotas ordenadas
    const cuotasOrdenadas = [...c.cuotas].sort((a, b) => a.numeroCuota - b.numeroCuota);
    
    this.estadoCuentaPdfService.generarEstadoCuenta(c, cuotasOrdenadas).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dni = c.cliente?.numeroDocumento || c.documento || 'credito';
        a.download = `Estado_Cuenta_${dni}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.descargandoEstadoCuenta.set(false);
    }).catch(err => {
        this.descargandoEstadoCuenta.set(false);
        console.error('Error al generar Estado de Cuenta:', err);
        alert('Error al generar el Estado de Cuenta. Por favor reintente.');
    });
  }

  postergarCuota(cuota: Cuota) {
    if (!this.isAdminMode() || this.procesando()) return;
    this.cuotaSeleccionada.set(cuota);
    this.mostrarModalPostergar.set(true);
  }

  handlePostergadoExitoso() {
    this.mostrarModalPostergar.set(false);
    this.cargarDetalle(this.credito()!.id);
  }

  renovarSoloInteres(cuota: Cuota) {
    if (!this.isAdminMode() || this.procesando()) return;
    this.cuotaSeleccionada.set(cuota);
    this.mostrarModalRenovar.set(true);
  }

  handleRenovacionExito() {
    this.mostrarModalRenovar.set(false);
    this.cargarDetalle(this.credito()!.id);
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

  pagoGlobal() {
    if (!this.isAdminMode() || this.procesando() || !this.credito()) return;
    
    const montoStr = prompt('Ingrese el monto del pago global (se distribuirá en cascada):');
    if (!montoStr) return;
    
    const monto = parseFloat(montoStr);
    if (isNaN(monto) || monto <= 0) {
      alert('Monto inválido.');
      return;
    }
    
    const metodo = prompt('Ingrese el método de pago (Ej. EFECTIVO, YAPE, TRANSFERENCIA):', 'EFECTIVO');
    if (!metodo) return;
    
    let comprobante = '';
    if (metodo !== 'EFECTIVO') {
      comprobante = prompt('Ingrese el número de comprobante/operación:') || '';
    }
    
    if (confirm(`¿Confirmas el pago global de S/ ${monto} con método ${metodo}?`)) {
      this.procesando.set(true);
      this.creditoService.registrarPagoGlobal(this.credito()!.id, monto, metodo, comprobante).subscribe({
        next: (resp) => {
          this.procesando.set(false);
          alert(resp.mensaje + ` (${resp.movimientosGenerados} cuotas afectadas)`);
          this.cargarDetalle(this.credito()!.id);
        },
        error: (err) => {
          this.procesando.set(false);
          alert(err.error?.error || 'Error al procesar el pago global');
        }
      });
    }
  }

  generarCuotaPostVencimiento() {
    if (!this.isAdminMode() || this.procesando() || !this.credito()) return;
    
    if (confirm('¿Generar nueva cuota post-vencimiento (10% del capital real pendiente)?')) {
      this.procesando.set(true);
      this.creditoService.generarCuotaPostVencimiento(this.credito()!.id).subscribe({
        next: (resp) => {
          this.procesando.set(false);
          alert(resp.mensaje);
          this.cargarDetalle(this.credito()!.id);
        },
        error: (err) => {
          this.procesando.set(false);
          alert(err.error?.error || 'Error al generar la cuota post-vencimiento');
        }
      });
    }
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  abrirModalRestriccion() {
    this.mostrarModalRestriccion.set(true);
  }

  cerrarModalRestriccion() {
    this.mostrarModalRestriccion.set(false);
  }

  getEstadoClase(estado: string): string {
    switch(estado) {
      case 'PAGADO': return 'badge-success text-success-content';
      case 'MORA': return 'badge-error text-error-content shadow-lg shadow-error/20';
      case 'PAGADO_PARCIAL': return 'badge-warning text-warning-content';
      case 'RESUELTO': return 'badge-neutral opacity-50';
      case 'REVISION': return 'badge-info text-info-content';
      default: return 'badge-ghost opacity-60';
    }
  }

  getProximoVencimiento(): Date | null {
    const c = this.credito();
    if (!c || !c.cuotas || c.cuotas.length === 0) return null;
    
    // Ordenar cuotas por número para asegurar el orden cronológico
    const cuotas = [...c.cuotas].sort((a, b) => a.numeroCuota - b.numeroCuota);
    
    // Encontrar la primera cuota que no esté completamente pagada
    const proxima = cuotas.find(cuota => cuota.estadoCuota !== 'PAGADO');
    
    return proxima ? proxima.fechaVencimiento : null;
  }

  removeFocus(event: Event) {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}
