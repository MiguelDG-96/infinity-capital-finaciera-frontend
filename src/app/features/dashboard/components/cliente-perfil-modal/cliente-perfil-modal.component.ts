import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Cliente } from '../../../../core/models/cliente.model';
import { ClienteService } from '../../../../core/services/cliente.service';

import { FormsModule } from '@angular/forms';

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

  archivoSeleccionado = signal<File | null>(null);
  subiendo = signal(false);
  error = signal<string | null>(null);

  isEditMode = signal(false);
  guardando = signal(false);
  clienteEdit = signal<any>({});

  constructor(private clienteService: ClienteService) {}

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
    this.clienteEdit.set({ ...this.cliente });
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
      estado: data.estado
    };

    this.clienteService.actualizarCliente(this.cliente.id, updateData).subscribe({
      next: () => {
        this.guardando.set(false);
        this.isEditMode.set(false);
        this.fotoActualizada.emit(); // Reutilizamos el evento para recargar datos
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err.error?.mensaje || 'Error al actualizar los datos');
      }
    });
  }
}
