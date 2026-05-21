import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Cliente } from '../../../../core/models/cliente.model';
import { ClienteService } from '../../../../core/services/cliente.service';
import { ReportePerfilPdfService } from '../../../../core/services/reporte-perfil-pdf.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-cliente-perfil-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './cliente-perfil-modal.component.html'
})
export class ClientePerfilModalComponent {
  @Input() cliente!: Cliente;
  @Output() cerrar = new EventEmitter<void>();
  @Output() fotoActualizada = new EventEmitter<void>();

  baseUrl = environment.apiUrl.replace('/api/v1', '');

  archivoSeleccionado = signal<File | null>(null);
  subiendo = signal(false);
  error = signal<string | null>(null);

  isEditMode = signal(false);
  guardando = signal(false);
  clienteEdit = signal<any>({});
  tabActiva = signal<'personal' | 'laboral' | 'ubicacion' | 'conyuge'>('personal');

  constructor(
    private clienteService: ClienteService,
    private reportePdfService: ReportePerfilPdfService
  ) {}

  imprimirPerfil() {
    this.reportePdfService.generarReporte(this.cliente);
  }

  setTab(tab: 'personal' | 'laboral' | 'ubicacion' | 'conyuge') {
    this.tabActiva.set(tab);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
    }
  }

  subirFoto() {
    const file = this.archivoSeleccionado();
    if (!file) return;
    if (!this.cliente?.id) {
      this.error.set('No se encontró el ID del cliente para subir la foto.');
      return;
    }

    this.subiendo.set(true);
    this.error.set(null);

    this.clienteService.subirFoto(this.cliente.id, file).subscribe({
      next: (res) => {
        this.subiendo.set(false);
        this.fotoActualizada.emit();
      },
      error: (err) => {
        this.subiendo.set(false);
        this.error.set(err.error?.error || 'Error al subir la foto');
      }
    });
  }

  activarEdicion() {
    const data = { ...this.cliente };
    
    // Parsear datosSolicitud si existe para facilitar la edición de campos de ubicación
    if (data.datosSolicitud) {
      try {
        const extra = JSON.parse(data.datosSolicitud);
        data.departamento = data.departamento || extra.departamento;
        data.provincia = data.provincia || extra.provincia;
        data.distrito = data.distrito || extra.distrito;
        data.urbanizacion = data.urbanizacion || extra.urbanizacion;
        data.manzana = data.manzana || extra.manzana;
        data.lote = data.lote || extra.lote;
        data.codigoPostal = data.codigoPostal || extra.codigoPostal;
        data.referencia = data.referencia || extra.referencia;
        data.nacionalidad = data.nacionalidad || extra.nacionalidad;
        data.gradoInstruccion = data.gradoInstruccion || extra.gradoInstruccion;
      } catch (e) {}
    }

    if (!data.conyuge) {
      data.conyuge = { nombreCompleto: '', dni: '' };
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
    
    // Actualizar datosSolicitud con los cambios en ubicación para mantener consistencia
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

    // Preparar el DTO de actualización
    const updateData = {
      nombreCompleto: data.nombre,
      telefono: data.telefono,
      celular: data.celular,
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento,
      direccion: data.direccion,
      referencia: data.referencia,
      domicilio: data.domicilio,
      fechaNacimiento: data.fechaNacimiento,
      estadoCivil: data.estadoCivil,
      situacionLaboral: data.situacionLaboral,
      empresa: data.empresa,
      cargoOcupacion: data.cargoOcupacion,
      ingresoMensual: data.ingresoMensual,
      rucEmpresa: data.rucEmpresa,
      telefonoEmpresa: data.telefonoEmpresa,
      direccionEmpresa: data.direccionEmpresa,
      canalEstadoCuenta: data.canalEstadoCuenta,
      tipoPersona: data.tipoPersona,
      limiteCredito: data.limiteCredito,
      estado: data.estado,
      contactoFamiliarNombre: data.contactoFamiliarNombre,
      contactoFamiliarCelular: data.contactoFamiliarCelular,
      viveCasaPropia: data.viveCasaPropia,
      conyugeNombre: data.conyuge?.nombreCompleto,
      conyugeDni: data.conyuge?.dni,
      conyugeOcupacion: data.conyuge?.ocupacion,
      conyugeIngresos: data.conyuge?.ingresosMensuales,
      conyugeTelefono: data.conyuge?.telefono,
      conyugeDireccion: data.conyuge?.direccion,
      datosSolicitud: JSON.stringify(datosSolicitudObj)
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
}
