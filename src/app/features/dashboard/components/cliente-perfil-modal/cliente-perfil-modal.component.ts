import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Cliente } from '../../../../core/models/cliente.model';
import { ClienteService } from '../../../../core/services/cliente.service';

@Component({
  selector: 'app-cliente-perfil-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './cliente-perfil-modal.component.html'
})
export class ClientePerfilModalComponent {
  @Input() cliente!: Cliente;
  @Output() cerrar = new EventEmitter<void>();
  @Output() fotoActualizada = new EventEmitter<void>();

  archivoSeleccionado = signal<File | null>(null);
  subiendo = signal(false);
  error = signal<string | null>(null);

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
}
