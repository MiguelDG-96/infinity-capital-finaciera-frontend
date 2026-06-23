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
import { CartaNoAdeudoPdfService } from '../../../../core/services/carta-no-adeudo-pdf.service';
import { CartaCobranzaPdfService } from '../../../../core/services/carta-cobranza-pdf.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PagoAnticipadoModalComponent } from '../../components/pago-anticipado-modal/pago-anticipado-modal.component';
import { GaranteModalComponent } from '../../components/garante-modal/garante-modal.component';
import { EditCuotaModalComponent } from '../../components/edit-cuota-modal/edit-cuota-modal.component';
import { EditCreditoModalComponent } from '../../components/edit-credito-modal/edit-credito-modal.component';
import { ClientePerfilModalComponent } from '../../components/cliente-perfil-modal/cliente-perfil-modal.component';
import { PostergarCuotaModalComponent } from '../../components/postergar-cuota-modal/postergar-cuota-modal.component';
import { RenovarSoloInteresModalComponent } from '../../components/renovar-solo-interes-modal/renovar-solo-interes-modal.component';
import { ResolverContratoModalComponent } from '../../components/resolver-contrato-modal/resolver-contrato-modal.component';
import { PagoGlobalModalComponent } from '../../components/pago-global-modal/pago-global-modal.component';
import { environment } from '../../../../../environments/environment';
import { validateFileClientSide } from '../../../../core/utils/file-validator.util';
import { ComprobantePagoComponent, ComprobanteData } from '../../../../shared/components/comprobante-pago/comprobante-pago';

@Component({
  selector: 'app-credito-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink, PagoAnticipadoModalComponent, GaranteModalComponent, EditCuotaModalComponent, EditCreditoModalComponent, ClientePerfilModalComponent, PostergarCuotaModalComponent, RenovarSoloInteresModalComponent, ResolverContratoModalComponent, PagoGlobalModalComponent, ComprobantePagoComponent],
  templateUrl: './credito-detalle.component.html',
  styleUrl: './credito-detalle.component.css'
})
export class CreditoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private creditoService = inject(CreditoService);
  private pdfService = inject(ContratoPdfService);
  private estadoCuentaPdfService = inject(EstadoCuentaPdfService);
  private cartaNoAdeudoPdfService = inject(CartaNoAdeudoPdfService);
  private cartaCobranzaPdfService = inject(CartaCobranzaPdfService);
  private toastService = inject(ToastService);

  readonly baseUrl = environment.apiUrl.replace('/api/v1', '');

  credito = signal<Credito | null>(null);
  isAdminMode = signal<boolean>(false);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  errorRegistrarPago = signal<string | null>(null);
  procesando = signal<boolean>(false);
  descargando = signal<boolean>(false);
  descargandoEstadoCuenta = signal<boolean>(false);
  isDownloading = signal<boolean>(false);
  mostrarModalPago = signal<boolean>(false);
  mostrarModalGarante = signal<boolean>(false);
  mostrarModalEditarCuota = signal<boolean>(false);
  mostrarModalEditarCredito = signal<boolean>(false);
  mostrarModalClientePerfil = signal<boolean>(false);
  mostrarModalPostergar = signal<boolean>(false);
  mostrarModalRenovar = signal<boolean>(false);
  mostrarModalResolver = signal<boolean>(false);
  mostrarModalPagoGlobal = signal<boolean>(false);
  mostrarModalConfirmarCuotasHastaHoy = signal<boolean>(false);
  mostrarModalConfirmarCuotaVencida = signal<boolean>(false);
  mostrarModalCartaCobranza = signal<boolean>(false);
  cuotaSeleccionada = signal<Cuota | null>(null);
  pagosRestringidos = signal<boolean>(false);
  mostrarModalRestriccion = signal<boolean>(false);
  isClienteRecurrente = signal<boolean>(false);
  mostrarInfoCredito = signal<boolean>(false);

  mostrarModalComprobante = signal<boolean>(false);
  comprobanteData = signal<ComprobanteData | null>(null);

  nivelCobranzaSelect = signal<number>(1);
  destinatarioCobranzaSelect = signal<'TITULAR' | 'GARANTE'>('TITULAR');
  emailCobranzaInput = signal<string>('');
  enviandoCorreoCobranza = signal<boolean>(false);

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
    const montoPendiente = Math.max(0, (cuota.totalCuota || 0) - (cuota.montoPagadoCliente || 0));
    this.comprobanteForm = {
      monto: Number(montoPendiente.toFixed(2)),
      metodoPago: 'YAPE',
      numeroComprobante: ''
    };
    this.comprobanteArchivo = null;
    this.comprobantePreviewUrl.set(null);
    this.errorRegistrarPago.set(null);
    this.mostrarModalSubirComprobante.set(true);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const errorMsg = validateFileClientSide(file, false);
      if (errorMsg) {
        this.errorRegistrarPago.set(errorMsg);
        return;
      }
      this.errorRegistrarPago.set(null);
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

  // ============ VER COMPROBANTE DE PAGO ============
  abrirComprobanteCuota(cuota: Cuota) {
    const cred = this.credito();
    if (!cred) return;

    // Convert total to words simple logic (fallback to string concatenation if complex)
    const intPart = Math.floor(cuota.montoPagadoCliente || cuota.totalCuota);
    const decimalPart = Math.round(((cuota.montoPagadoCliente || cuota.totalCuota) - intPart) * 100);
    
    // Preparar los conceptos (Capital, Interés, Seguro, Mora, etc)
    const conceptos = [];
    if ((cuota.capital || 0) > 0) conceptos.push({ description: 'PAGO A CAPITAL', value: cuota.capital || 0 });
    if ((cuota.interes || 0) > 0) conceptos.push({ description: 'PAGO A INTERESES', value: cuota.interes || 0 });
    if ((cuota.seguro || 0) > 0) conceptos.push({ description: 'PAGO DE SEGURO', value: cuota.seguro || 0 });
    if ((cuota.comision || 0) > 0) conceptos.push({ description: 'COMISIONES', value: cuota.comision || 0 });
    if ((cuota.penalidad || 0) > 0) conceptos.push({ description: 'PENALIDAD', value: cuota.penalidad || 0 });
    const mora = this.getMoraVisual(cuota);
    if (mora > 0) conceptos.push({ description: 'PAGO DE MORA', value: mora });

    // Ajuste si hay monto pagado diferente al total (solo para que cuadre el recibo visual)
    const totalConceptos = conceptos.reduce((sum, item) => sum + item.value, 0);

    const data: ComprobanteData = {
      customerName: cred.cliente?.usuario?.nombreCompleto || cred.nombreCliente || '',
      customerAddress: cred.cliente?.direccion || 'NO REGISTRADO',
      customerDni: cred.cliente?.numeroDocumento || cred.documento || '',
      operationNumber: String(cuota.id).padStart(8, '0'),
      emissionDate: cuota.fechaPago || new Date(),
      paymentDate: cuota.fechaPago || new Date(),
      product: 'CRÉDITO ' + (cred.tipoCredito ? cred.tipoCredito.toUpperCase() : 'PERSONAL'),
      subProduct: 'CUOTA NRO ' + cuota.numeroCuota,
      installmentNumber: cuota.numeroCuota + ' de ' + cred.cuotas.length,
      paymentToCapital: cuota.capital,
      concepts: conceptos,
      isFullPayment: cuota.estadoCuota === 'PAGADO',
      totalInWords: `SON: ${intPart} CON ${decimalPart}/100 SOLES` // Simple format
    };

    this.comprobanteData.set(data);
    this.mostrarModalComprobante.set(true);
  }

  // ============ OTROS ============

  pagoAnticipadoGuardado(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarDetalle(id);
  }

  handleResolucionConfirmada(): void {
    this.mostrarModalResolver.set(false);
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarDetalle(id);
  }

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

  async descargarCartaNoAdeudo() {
    const data = this.credito();
    if (!data) return;

    try {
      this.isDownloading.set(true);
      const blob = await this.cartaNoAdeudoPdfService.generarCarta(data);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Carta_No_Adeudo_${data.cliente?.numeroDocumento || 'Cliente'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      this.toastService.show('Carta de No Adeudo descargada correctamente', 'success');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.toastService.show('Error al generar la Carta de No Adeudo', 'error');
    } finally {
      this.isDownloading.set(false);
    }
  }

  abrirModalCartaCobranza() {
    this.nivelCobranzaSelect.set(1);
    this.destinatarioCobranzaSelect.set('TITULAR');
    this.prellenarEmailCobranza();
    this.mostrarModalCartaCobranza.set(true);
  }

  cambioDestinatarioCobranza(dest: 'TITULAR' | 'GARANTE') {
    this.destinatarioCobranzaSelect.set(dest);
    this.prellenarEmailCobranza();
  }

  prellenarEmailCobranza() {
    const c = this.credito();
    if (!c) return;
    if (this.destinatarioCobranzaSelect() === 'TITULAR') {
      this.emailCobranzaInput.set(c.cliente?.usuario?.email || '');
    } else {
      this.emailCobranzaInput.set(''); // Los garantes actualmente no tienen email por defecto en su modelo
    }
  }

  async generarBlobCartaCobranza(): Promise<Blob | null> {
    const c = this.credito();
    if (!c) return null;
    try {
      return await this.cartaCobranzaPdfService.generarCarta(
        c,
        c.cuotas,
        this.nivelCobranzaSelect(),
        this.destinatarioCobranzaSelect() === 'GARANTE'
      );
    } catch (error) {
      console.error('Error al generar Blob de cobranza:', error);
      return null;
    }
  }

  async enviarCartaCobranzaCorreo() {
    const c = this.credito();
    if (!c || this.enviandoCorreoCobranza()) return;

    const email = this.emailCobranzaInput().trim();
    if (!email) {
      this.toastService.show('Por favor, ingresa un correo electrónico válido.', 'error');
      return;
    }

    this.enviandoCorreoCobranza.set(true);
    const blob = await this.generarBlobCartaCobranza();
    
    if (!blob) {
      this.enviandoCorreoCobranza.set(false);
      this.toastService.show('Error al generar la Carta de Cobranza para enviar', 'error');
      return;
    }

    let nombreDestinatario = 'Cliente';
    if (this.destinatarioCobranzaSelect() === 'TITULAR') {
       nombreDestinatario = c.cliente?.usuario?.nombreCompleto || c.nombreCliente || 'Titular';
    } else {
       const garanteActivo = c.garantes?.find(g => true); // In this context garantes just exist.
       nombreDestinatario = garanteActivo?.nombreCompleto || 'Garante';
    }

    this.creditoService.enviarCartaCobranza(
      c.id,
      blob,
      email,
      nombreDestinatario,
      this.nivelCobranzaSelect()
    ).subscribe({
      next: (resp) => {
        this.enviandoCorreoCobranza.set(false);
        this.mostrarModalCartaCobranza.set(false);
        this.toastService.show(resp.mensaje || 'Carta enviada exitosamente por correo.', 'success');
      },
      error: (err) => {
        this.enviandoCorreoCobranza.set(false);
        console.error('Error enviando carta de cobranza:', err);
        this.toastService.show(err.error?.error || 'Error al enviar la carta de cobranza por correo', 'error');
      }
    });
  }

  async descargarCartaCobranza() {
    const c = this.credito();
    if (!c || this.isDownloading()) return;

    try {
      this.isDownloading.set(true);
      const blob = await this.cartaCobranzaPdfService.generarCarta(
        c, 
        c.cuotas, 
        this.nivelCobranzaSelect(), 
        this.destinatarioCobranzaSelect() === 'GARANTE'
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const destinatario = this.destinatarioCobranzaSelect() === 'GARANTE' ? 'Garante' : 'Titular';
      a.download = `Carta_Cobranza_Nivel${this.nivelCobranzaSelect()}_${destinatario}_${c.documento}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      this.mostrarModalCartaCobranza.set(false);
      this.toastService.show('Carta de cobranza descargada correctamente', 'success');
    } catch (error) {
      console.error('Error al generar PDF de cobranza:', error);
      this.toastService.show('Error al generar la Carta de Cobranza', 'error');
    } finally {
      this.isDownloading.set(false);
    }
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
    this.mostrarModalPagoGlobal.set(true);
  }

  handlePagoGlobalExitoso(resp: any) {
    this.mostrarModalPagoGlobal.set(false);
    alert(resp.mensaje + ` (${resp.movimientosGenerados} cuotas afectadas)`);
    this.cargarDetalle(this.credito()!.id);
  }

  generarCuotaPostVencimiento() {
    if (!this.isAdminMode() || this.procesando() || !this.credito()) return;
    this.mostrarModalConfirmarCuotaVencida.set(true);
  }

  ejecutarGenerarCuotaPostVencimiento() {
    this.procesando.set(true);
    this.creditoService.generarCuotaPostVencimiento(this.credito()!.id).subscribe({
      next: (resp) => {
        this.procesando.set(false);
        this.mostrarModalConfirmarCuotaVencida.set(false);
        alert(resp.mensaje);
        this.cargarDetalle(this.credito()!.id);
      },
      error: (err) => {
        this.procesando.set(false);
        this.mostrarModalConfirmarCuotaVencida.set(false);
        alert(err.error?.error || 'Error al generar la cuota post-vencimiento');
      }
    });
  }

  generarCuotasPostVencimientoHastaHoy() {
    if (!this.isAdminMode() || this.procesando() || !this.credito()) return;
    this.mostrarModalConfirmarCuotasHastaHoy.set(true);
  }

  ejecutarGenerarCuotasHastaHoy() {
    this.procesando.set(true);
    this.creditoService.generarCuotasPostVencimientoHastaHoy(this.credito()!.id).subscribe({
      next: (resp) => {
        this.procesando.set(false);
        this.mostrarModalConfirmarCuotasHastaHoy.set(false);
        this.toastService.show(`${resp.mensaje} (Se generaron ${resp.cantidadGenerada} cuotas)`, 'success');
        this.cargarDetalle(this.credito()!.id);
      },
      error: (err) => {
        this.procesando.set(false);
        this.mostrarModalConfirmarCuotasHastaHoy.set(false);
        this.toastService.show(err.error?.error || 'Error al generar las cuotas', 'error');
      }
    });
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

  getMoraVisual(cuota: Cuota): number {
    if (cuota.interesMora && cuota.interesMora > 0) return cuota.interesMora;
    const base = (cuota.capital || 0) + (cuota.interes || 0) + (cuota.seguro || 0) + (cuota.comision || 0);
    const dif = (cuota.totalCuota || 0) - base - (cuota.penalidad || 0);
    return dif > 0.01 ? dif : 0;
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
// trigger recompile
