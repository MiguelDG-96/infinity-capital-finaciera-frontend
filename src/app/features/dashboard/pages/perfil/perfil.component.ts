import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { environment } from '../../../../../environments/environment';
import { Cliente } from '../../../../core/models/cliente.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  readonly baseUrl = environment.apiUrl.replace('/api/v1', '');

  // Estado
  cargando = signal(false);
  guardandoDatos = signal(false);
  enviandoReset = signal(false);
  subiendoFoto = signal(false);
  mensajeExito = signal<string | null>(null);
  mensajeError = signal<string | null>(null);

  // Perfil
  clienteData = signal<Cliente | null>(null);
  adminUserId = signal<number | null>(null);

  fotoPreviewUrl = signal<string | null>(null);
  fotoArchivo: File | null = null;

  // Formulario
  form = { nombreCompleto: '', email: '' };
  emailReset = '';
  resetEnviado = signal(false);

  get userData() { return this.authService.currentUserData(); }
  get userPhotoUrl(): string | null {
    const local = this.authService.profilePhotoUrl();
    if (local) return `${this.baseUrl}/api/v1/archivos${local}`;
    return null;
  }
  get userInitials(): string {
    const name = this.form.nombreCompleto.trim() || 'US';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  get isCliente(): boolean { return this.userData?.rol === 'ROLE_CLIENTE'; }
  get isAdminOrWorker(): boolean {
    const r = this.userData?.rol || '';
    return r === 'ROLE_ADMIN' || r === 'ROLE_TRABAJADOR';
  }
  get rolLabel(): string {
    const r = this.userData?.rol || '';
    if (r === 'ROLE_ADMIN') return 'Administrador';
    if (r === 'ROLE_TRABAJADOR') return 'Trabajador';
    return 'Cliente';
  }

  ngOnInit() {
    this.form.nombreCompleto = this.userData?.nombreCompleto || '';
    this.form.email = this.userData?.sub || '';
    this.emailReset = this.userData?.sub || '';

    if (this.isCliente) {
      this.cargando.set(true);
      this.clienteService.obtenerPerfil().subscribe({
        next: (c) => {
          this.clienteData.set(c);
          this.cargando.set(false);
          if (c.fotoUrl) this.authService.updateProfilePhoto(c.fotoUrl);
        },
        error: () => this.cargando.set(false)
      });
    } else if (this.isAdminOrWorker) {
      const myEmail = this.userData?.sub || '';
      this.usuarioService.listarUsuarios().subscribe({
        next: (users) => {
          const me = users.find(u => u.email === myEmail);
          if (me) this.adminUserId.set(me.id);
        },
        error: () => {}
      });
    }

  }

  guardarDatos() {
    if (!this.form.nombreCompleto.trim()) return;
    this.guardandoDatos.set(true);
    this.clearMessages();

    if (this.isCliente) {
      this.clienteService.actualizarPerfilPropio({
        nombreCompleto: this.form.nombreCompleto,
        email: this.form.email
      }).subscribe({
        next: () => {
          this.guardandoDatos.set(false);
          this.mensajeExito.set('Datos actualizados. Vuelve a iniciar sesión para ver el nombre actualizado.');
        },
        error: (err) => {
          this.guardandoDatos.set(false);
          this.mensajeError.set(err.error?.error || 'Error al actualizar los datos.');
        }
      });
    } else {
      const id = this.adminUserId();
      if (!id) {
        this.guardandoDatos.set(false);
        this.mensajeError.set('No se pudo obtener tu ID de usuario.');
        return;
      }
      this.usuarioService.actualizarMiPerfil(id, {
        nombreCompleto: this.form.nombreCompleto,
        email: this.form.email
      }).subscribe({

        next: () => {
          this.guardandoDatos.set(false);
          this.mensajeExito.set('Datos actualizados. Vuelve a iniciar sesión para ver los cambios reflejados.');
        },
        error: (err) => {
          this.guardandoDatos.set(false);
          this.mensajeError.set(err.error?.error || 'Error al actualizar los datos.');
        }
      });
    }
  }

  enviarResetContrasena() {
    if (!this.emailReset.trim()) return;
    this.enviandoReset.set(true);
    this.clearMessages();
    this.authService.forgotPassword(this.emailReset).subscribe({
      next: () => {
        this.enviandoReset.set(false);
        this.resetEnviado.set(true);
        this.mensajeExito.set(`Se envió un código a ${this.emailReset}. Revisa tu correo.`);
      },
      error: (err) => {
        this.enviandoReset.set(false);
        this.mensajeError.set(err.error?.mensaje || 'Error al enviar el correo.');
      }
    });
  }

  onFotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.fotoArchivo = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.fotoPreviewUrl.set(e.target?.result as string);
      reader.readAsDataURL(this.fotoArchivo);
    }
  }

  onFotoDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.fotoArchivo = file;
      const reader = new FileReader();
      reader.onload = (e) => this.fotoPreviewUrl.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

  guardarFoto() {
    const cliente = this.clienteData();
    if (!this.fotoArchivo || !cliente) return;
    this.subiendoFoto.set(true);
    this.clearMessages();
    this.clienteService.subirFoto(cliente.id, this.fotoArchivo).subscribe({
      next: (res) => {
        this.subiendoFoto.set(false);
        this.authService.updateProfilePhoto(res.url);
        this.fotoArchivo = null;
        this.fotoPreviewUrl.set(null);
        this.mensajeExito.set('Foto de perfil actualizada correctamente.');
      },
      error: (err) => {
        this.subiendoFoto.set(false);
        this.mensajeError.set(err.error?.error || 'Error al subir la foto.');
      }
    });
  }

  private clearMessages() {
    this.mensajeExito.set(null);
    this.mensajeError.set(null);
  }

  volver() { this.router.navigate(['/dashboard']); }
}
