import {
  Component, EventEmitter, Input, Output,
  signal, OnChanges, SimpleChanges, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { Cliente } from '../../../../core/models/cliente.model';
import {
  ActivoResponse, PasivoResponse, PatrimonioResponse,
  TipoActivo, TipoPasivo, LABELS_ACTIVO, LABELS_PASIVO
} from '../../../../core/models/patrimonio.model';
import { ClienteService } from '../../../../core/services/cliente.service';
import { PatrimonioService } from '../../../../core/services/patrimonio.service';
import { ReportePerfilPdfService } from '../../../../core/services/reporte-perfil-pdf.service';
import { environment } from '../../../../../environments/environment';

type TabActiva = 'personal' | 'laboral' | 'ubicacion' | 'conyuge' | 'patrimonio';

interface FilaActivoEdit {
  id?: number;
  tipo: TipoActivo;
  descripcion: string;
  valorEstimado: number | null;
  observacion: string;
  docUrl?: string;
  /** archivo pendiente de subir */
  archivoDoc?: File | null;
  guardando?: boolean;
  error?: string;
  isEditing?: boolean;
}

interface FilaPasivoEdit {
  id?: number;
  tipo: TipoPasivo;
  entidadAcreedora: string;
  montoPendiente: number | null;
  cuotaMensual: number | null;
  vencimiento: string;
  observacion: string;
  docUrl?: string;
  archivoDoc?: File | null;
  guardando?: boolean;
  error?: string;
  isEditing?: boolean;
}

@Component({
  selector: 'app-cliente-perfil-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './cliente-perfil-modal.component.html'
})
export class ClientePerfilModalComponent implements OnChanges {
  @Input() cliente!: Cliente;
  @Output() cerrar = new EventEmitter<void>();
  @Output() fotoActualizada = new EventEmitter<void>();

  // ── Servicios ────────────────────────────────────────────────────────────
  private clienteService   = inject(ClienteService);
  private patrimonioSvc    = inject(PatrimonioService);
  private reportePdfService = inject(ReportePerfilPdfService);

  // ── Datos del cliente ────────────────────────────────────────────────────
  clienteView: any = {};
  baseUrl = environment.apiUrl.replace('/api/v1', '');

  // ── UI general ───────────────────────────────────────────────────────────
  archivoSeleccionado = signal<File | null>(null);
  subiendo   = signal(false);
  error      = signal<string | null>(null);
  isEditMode = signal(false);
  guardando  = signal(false);
  clienteEdit = signal<any>({});
  tabActiva  = signal<TabActiva>('personal');

  // ── Patrimonio ───────────────────────────────────────────────────────────
  patrimonio          = signal<PatrimonioResponse | null>(null);
  cargandoPatrimonio  = signal(false);
  errorPatrimonio     = signal<string | null>(null);

  /** Filas editables de activos (una por cada activo existente + fila nueva) */
  filasActivos  = signal<FilaActivoEdit[]>([]);
  filasPasivos  = signal<FilaPasivoEdit[]>([]);

  /** Controla si se muestra el formulario de nueva fila */
  mostrarNuevoActivo = signal(false);
  mostrarNuevoPasivo = signal(false);

  nuevoActivo: FilaActivoEdit = this.emptyActivo();
  nuevoPasivo: FilaPasivoEdit = this.emptyPasivo();

  // ── Catálogos expuestos al template ──────────────────────────────────────
  readonly tiposActivo: TipoActivo[]  = ['INMUEBLE', 'AHORROS', 'PLAZO_FIJO', 'AUTO', 'OTRO'];
  readonly tiposPasivo: TipoPasivo[]  = ['TARJETAS', 'CORTO_PLAZO', 'LARGO_PLAZO', 'HIPOTECARIO', 'OTRO'];
  readonly labelsActivo = LABELS_ACTIVO;
  readonly labelsPasivo = LABELS_PASIVO;

  // ────────────────────────────────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cliente'] && this.cliente) {
      this.clienteView = { ...this.cliente };

      // Merge extra fields from datosSolicitud JSON (JSON is fallback, real columns win)
      if (this.cliente.datosSolicitud && typeof this.cliente.datosSolicitud === 'string') {
        try {
          const extra = JSON.parse(this.cliente.datosSolicitud);
          Object.keys(extra).forEach(key => {
            if (this.clienteView[key] === undefined || this.clienteView[key] === null || this.clienteView[key] === '') {
              this.clienteView[key] = extra[key];
            }
          });
        } catch (e) {
          console.warn('Error parsing datosSolicitud', e);
        }
      }

      // Normalize Java LocalDate array [YYYY, MM, DD] → "YYYY-MM-DD" string
      const fn = this.clienteView.fechaNacimiento;
      if (Array.isArray(fn)) {
        const [year, month, day] = fn;
        this.clienteView.fechaNacimiento = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }

      // Cargar patrimonio cuando se abre/cambia el cliente
      this.cargarPatrimonio();
    }
  }

  // ── Tab ──────────────────────────────────────────────────────────────────
  setTab(tab: TabActiva) {
    this.tabActiva.set(tab);
    if (tab === 'patrimonio' && !this.patrimonio()) {
      this.cargarPatrimonio();
    }
  }

  // ── Foto de perfil ───────────────────────────────────────────────────────
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.archivoSeleccionado.set(file);
  }

  subirFoto() {
    const file = this.archivoSeleccionado();
    if (!file || !this.cliente?.id) {
      this.error.set('No se encontró el ID del cliente para subir la foto.');
      return;
    }
    this.subiendo.set(true);
    this.error.set(null);

    this.clienteService.subirFoto(this.cliente.id, file).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.fotoActualizada.emit();
      },
      error: (err) => {
        this.subiendo.set(false);
        this.error.set(err.error?.error || 'Error al subir la foto');
      }
    });
  }

  // ── Edición de datos del cliente ─────────────────────────────────────────
  imprimirPerfil() {
    const patrimonioData = this.patrimonio();
    this.reportePdfService.generarReporte(this.clienteView, patrimonioData ?? undefined);
  }

  activarEdicion() {
    const data = { ...this.clienteView };
    if (!data.conyuge) {
      data.conyuge = {
        nombresConyuge: '', apellidoPaConyuge: '', apellidoMatConyuge: '',
        tipoDocumento: 'DNI', numeroDocumento: ''
      };
    }
    this.clienteEdit.set(data);
    this.isEditMode.set(true);
  }

  cancelarEdicion() {
    this.isEditMode.set(false);
  }

  guardarCambios() {
    if (!this.cliente?.id) return;
    this.guardando.set(true);
    this.error.set(null);

    const data = this.clienteEdit();

    const datosSolicitudObj = {
      departamento: data.departamento,
      provincia: data.provincia,
      distrito: data.distrito,
      urbanizacion: data.urbanizacion,
      manzana: data.manzana,
      lote: data.lote,
      codigoPostal: data.codigoPostal,
      referencia: data.referencia,
      nacionalidad: data.nacionalidad,
      gradoInstruccion: data.gradoInstruccion
    };

    const updateData = {
      nombreCompleto:          data.nombre,
      telefono:                data.telefono,
      celular:                 data.celular,
      tipoDocumento:           data.tipoDocumento,
      numeroDocumento:         data.numeroDocumento,
      direccion:               data.direccion,
      referencia:              data.referencia,
      domicilio:               data.domicilio,
      fechaNacimiento:         data.fechaNacimiento,
      estadoCivil:             data.estadoCivil,
      situacionLaboral:        data.situacionLaboral,
      empresa:                 data.empresa,
      cargoOcupacion:          data.cargoOcupacion,
      ingresoMensual:          data.ingresoMensual,
      rucEmpresa:              data.rucEmpresa,
      telefonoEmpresa:         data.telefonoEmpresa,
      direccionEmpresa:        data.direccionEmpresa,
      canalEstadoCuenta:       data.canalEstadoCuenta,
      tipoPersona:             data.tipoPersona,
      limiteCredito:           data.limiteCredito,
      estado:                  data.estado,
      contactoFamiliarNombre:  data.contactoFamiliarNombre,
      contactoFamiliarCelular: data.contactoFamiliarCelular,
      viveCasaPropia:          data.viveCasaPropia,
      nombresConyuge:          data.conyuge?.nombresConyuge,
      apellidoPaConyuge:       data.conyuge?.apellidoPaConyuge,
      apellidoMatConyuge:      data.conyuge?.apellidoMatConyuge,
      conyugeTipoDocumento:    data.conyuge?.tipoDocumento,
      conyugeNumeroDocumento:  data.conyuge?.numeroDocumento,
      conyugeOcupacion:        data.conyuge?.ocupacion,
      conyugeIngresos:         data.conyuge?.ingresosMensuales,
      conyugeTelefono:         data.conyuge?.telefono,
      conyugeDireccion:        data.conyuge?.direccion,
      datosSolicitud:          JSON.stringify(datosSolicitudObj)
    };

    this.clienteService.actualizarCliente(this.cliente.id, updateData).subscribe({
      next: () => {
        this.guardando.set(false);
        this.isEditMode.set(false);
        this.fotoActualizada.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err.error?.mensaje || 'Error al actualizar los datos');
      }
    });
  }

  // ── PATRIMONIO ────────────────────────────────────────────────────────────

  cargarPatrimonio() {
    if (!this.cliente?.id) return;
    this.cargandoPatrimonio.set(true);
    this.errorPatrimonio.set(null);

    this.patrimonioSvc.obtenerPatrimonio(this.cliente.id).subscribe({
      next: (res) => {
        this.patrimonio.set(res);
        this.sincronizarFilas(res);
        this.cargandoPatrimonio.set(false);
      },
      error: (err) => {
        this.cargandoPatrimonio.set(false);
        this.errorPatrimonio.set(err.error?.error || 'Error al cargar el patrimonio');
      }
    });
  }

  private sincronizarFilas(res: PatrimonioResponse) {
    this.filasActivos.set(res.activos.map(a => ({
      id: a.id,
      tipo: a.tipo,
      descripcion: a.descripcion || '',
      valorEstimado: a.valorEstimado ?? null,
      observacion: a.observacion || '',
      docUrl: a.docUrl,
      archivoDoc: null,
      guardando: false,
      error: undefined
    })));
    this.filasPasivos.set(res.pasivos.map(p => ({
      id: p.id,
      tipo: p.tipo,
      entidadAcreedora: p.entidadAcreedora || '',
      montoPendiente: p.montoPendiente ?? null,
      cuotaMensual: p.cuotaMensual ?? null,
      vencimiento: p.vencimiento || '',
      observacion: p.observacion || '',
      docUrl: p.docUrl,
      archivoDoc: null,
      guardando: false,
      error: undefined
    })));
  }

  // ── ACTIVOS ───────────────────────────────────────────────────────────────

  private emptyActivo(): FilaActivoEdit {
    return { tipo: 'INMUEBLE', descripcion: '', valorEstimado: null, observacion: '', archivoDoc: null, guardando: false };
  }

  iniciarNuevoActivo() {
    this.nuevoActivo = this.emptyActivo();
    this.mostrarNuevoActivo.set(true);
  }

  cancelarNuevoActivo() {
    this.mostrarNuevoActivo.set(false);
  }

  onDocActivoNuevoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.nuevoActivo.archivoDoc = input.files?.[0] ?? null;
  }

  onDocActivoExistenteSelected(event: Event, fila: FilaActivoEdit) {
    const input = event.target as HTMLInputElement;
    fila.archivoDoc = input.files?.[0] ?? null;
  }

  guardarNuevoActivo() {
    if (!this.cliente?.id) return;
    if (!this.nuevoActivo.tipo) {
      this.nuevoActivo.error = 'El tipo es obligatorio';
      return;
    }

    this.nuevoActivo.guardando = true;
    this.nuevoActivo.error = undefined;

    this.patrimonioSvc.crearActivo(this.cliente.id, {
      tipo:           this.nuevoActivo.tipo,
      descripcion:    this.nuevoActivo.descripcion || undefined,
      valorEstimado:  this.nuevoActivo.valorEstimado ?? undefined,
      observacion:    this.nuevoActivo.observacion  || undefined
    }).subscribe({
      next: (activoCreado) => {
        // Si hay documento, subirlo después de crear
        const archivo = this.nuevoActivo.archivoDoc;
        if (archivo) {
          this.patrimonioSvc.subirDocumentoActivo(this.cliente.id, activoCreado.id, archivo).subscribe({
            next:  () => { this.mostrarNuevoActivo.set(false); this.cargarPatrimonio(); },
            error: (err) => {
              this.nuevoActivo.guardando = false;
              this.nuevoActivo.error = err.error?.error || 'Activo creado pero error al subir el documento';
              this.cargarPatrimonio();
            }
          });
        } else {
          this.nuevoActivo.guardando = false;
          this.mostrarNuevoActivo.set(false);
          this.cargarPatrimonio();
        }
      },
      error: (err) => {
        this.nuevoActivo.guardando = false;
        this.nuevoActivo.error = err.error?.error || 'Error al crear el activo';
      }
    });
  }

  guardarActivoExistente(fila: FilaActivoEdit) {
    if (!this.cliente?.id || !fila.id) return;
    if (!fila.tipo) { fila.error = 'El tipo es obligatorio'; return; }

    fila.guardando = true;
    fila.error = undefined;

    this.patrimonioSvc.actualizarActivo(this.cliente.id, fila.id, {
      tipo:          fila.tipo,
      descripcion:   fila.descripcion  || undefined,
      valorEstimado: fila.valorEstimado ?? undefined,
      observacion:   fila.observacion  || undefined
    }).subscribe({
      next: () => {
        const archivo = fila.archivoDoc;
        if (archivo && fila.id) {
          this.patrimonioSvc.subirDocumentoActivo(this.cliente.id, fila.id, archivo).subscribe({
            next:  () => { fila.guardando = false; this.cargarPatrimonio(); },
            error: (err) => {
              fila.guardando = false;
              fila.error = err.error?.error || 'Datos guardados pero error al subir el documento';
              this.cargarPatrimonio();
            }
          });
        } else {
          fila.guardando = false;
          this.cargarPatrimonio();
        }
      },
      error: (err) => {
        fila.guardando = false;
        fila.error = err.error?.error || 'Error al actualizar el activo';
      }
    });
  }

  eliminarActivo(fila: FilaActivoEdit) {
    if (!this.cliente?.id || !fila.id) return;
    if (!confirm(`¿Eliminar el activo "${this.labelsActivo[fila.tipo]}"?`)) return;

    fila.guardando = true;
    fila.error = undefined;

    this.patrimonioSvc.eliminarActivo(this.cliente.id, fila.id).subscribe({
      next: () => this.cargarPatrimonio(),
      error: (err) => {
        fila.guardando = false;
        fila.error = err.error?.error || 'Error al eliminar el activo';
      }
    });
  }

  editarActivo(fila: FilaActivoEdit) {
    fila.isEditing = true;
  }

  cancelarEdicionActivo(fila: FilaActivoEdit) {
    fila.isEditing = false;
    this.cargarPatrimonio(); // Recargar para deshacer cambios locales
  }

  // ── PASIVOS ───────────────────────────────────────────────────────────────

  private emptyPasivo(): FilaPasivoEdit {
    return {
      tipo: 'TARJETAS', entidadAcreedora: '', montoPendiente: null,
      cuotaMensual: null, vencimiento: '', observacion: '', archivoDoc: null, guardando: false
    };
  }

  iniciarNuevoPasivo() {
    this.nuevoPasivo = this.emptyPasivo();
    this.mostrarNuevoPasivo.set(true);
  }

  cancelarNuevoPasivo() {
    this.mostrarNuevoPasivo.set(false);
  }

  onDocPasivoNuevoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.nuevoPasivo.archivoDoc = input.files?.[0] ?? null;
  }

  onDocPasivoExistenteSelected(event: Event, fila: FilaPasivoEdit) {
    const input = event.target as HTMLInputElement;
    fila.archivoDoc = input.files?.[0] ?? null;
  }

  guardarNuevoPasivo() {
    if (!this.cliente?.id) return;
    if (!this.nuevoPasivo.tipo) { this.nuevoPasivo.error = 'El tipo es obligatorio'; return; }

    this.nuevoPasivo.guardando = true;
    this.nuevoPasivo.error = undefined;

    this.patrimonioSvc.crearPasivo(this.cliente.id, {
      tipo:             this.nuevoPasivo.tipo,
      entidadAcreedora: this.nuevoPasivo.entidadAcreedora || undefined,
      montoPendiente:   this.nuevoPasivo.montoPendiente   ?? undefined,
      cuotaMensual:     this.nuevoPasivo.cuotaMensual     ?? undefined,
      vencimiento:      this.nuevoPasivo.vencimiento      || undefined,
      observacion:      this.nuevoPasivo.observacion      || undefined
    }).subscribe({
      next: (pasivoCreado) => {
        const archivo = this.nuevoPasivo.archivoDoc;
        if (archivo) {
          this.patrimonioSvc.subirDocumentoPasivo(this.cliente.id, pasivoCreado.id, archivo).subscribe({
            next:  () => { this.mostrarNuevoPasivo.set(false); this.cargarPatrimonio(); },
            error: (err) => {
              this.nuevoPasivo.guardando = false;
              this.nuevoPasivo.error = err.error?.error || 'Pasivo creado pero error al subir el documento';
              this.cargarPatrimonio();
            }
          });
        } else {
          this.nuevoPasivo.guardando = false;
          this.mostrarNuevoPasivo.set(false);
          this.cargarPatrimonio();
        }
      },
      error: (err) => {
        this.nuevoPasivo.guardando = false;
        this.nuevoPasivo.error = err.error?.error || 'Error al crear el pasivo';
      }
    });
  }

  guardarPasivoExistente(fila: FilaPasivoEdit) {
    if (!this.cliente?.id || !fila.id) return;
    if (!fila.tipo) { fila.error = 'El tipo es obligatorio'; return; }

    fila.guardando = true;
    fila.error = undefined;

    this.patrimonioSvc.actualizarPasivo(this.cliente.id, fila.id, {
      tipo:             fila.tipo,
      entidadAcreedora: fila.entidadAcreedora || undefined,
      montoPendiente:   fila.montoPendiente   ?? undefined,
      cuotaMensual:     fila.cuotaMensual     ?? undefined,
      vencimiento:      fila.vencimiento      || undefined,
      observacion:      fila.observacion      || undefined
    }).subscribe({
      next: () => {
        const archivo = fila.archivoDoc;
        if (archivo && fila.id) {
          this.patrimonioSvc.subirDocumentoPasivo(this.cliente.id, fila.id, archivo).subscribe({
            next:  () => { fila.guardando = false; this.cargarPatrimonio(); },
            error: (err) => {
              fila.guardando = false;
              fila.error = err.error?.error || 'Datos guardados pero error al subir el documento';
              this.cargarPatrimonio();
            }
          });
        } else {
          fila.guardando = false;
          this.cargarPatrimonio();
        }
      },
      error: (err) => {
        fila.guardando = false;
        fila.error = err.error?.error || 'Error al actualizar el pasivo';
      }
    });
  }

  eliminarPasivo(fila: FilaPasivoEdit) {
    if (!this.cliente?.id || !fila.id) return;
    if (!confirm(`¿Eliminar el pasivo de "${fila.entidadAcreedora}"?`)) return;

    fila.guardando = true;
    fila.error = undefined;

    this.patrimonioSvc.eliminarPasivo(this.cliente.id, fila.id).subscribe({
      next: () => this.cargarPatrimonio(),
      error: (err) => {
        fila.guardando = false;
        fila.error = err.error?.error || 'Error al eliminar el pasivo';
      }
    });
  }

  editarPasivo(fila: FilaPasivoEdit) {
    fila.isEditing = true;
  }

  cancelarEdicionPasivo(fila: FilaPasivoEdit) {
    fila.isEditing = false;
    this.cargarPatrimonio(); // Recargar para deshacer cambios locales
  }

  // ── Utilidades ────────────────────────────────────────────────────────────

  buildDocUrl(relUrl: string | undefined): string | null {
    return this.patrimonioSvc.buildDocUrl(relUrl);
  }

  formatVencimiento(v: string): string {
    if (!v) return '--';
    return v; // ya viene en "MM/YYYY"
  }

  fmtMoney(val: number | null | undefined): string {
    if (val == null || val === 0) return '--';
    return `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
