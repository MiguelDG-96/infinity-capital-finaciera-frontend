import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { environment } from '../../../../../environments/environment';
import { WebAuthnUtils } from '../../../../core/utils/webauthn.utils';
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
  cambiandoPassword = signal(false);
  subiendoFoto = signal(false);
  mensajeExito = signal<string | null>(null);
  mensajeError = signal<string | null>(null);

  // Perfil
  clienteData = signal<Cliente | null>(null);
  adminUserId = signal<number | null>(null);

  fotoPreviewUrl = signal<string | null>(null);
  fotoArchivo: File | null = null;

  // Tabs
  activeTab = signal<'personal' | 'seguridad' | 'sesion' | 'dispositivos'>('personal');

  // Formulario
  form = { 
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '' 
  };
  
  // Contraseña
  formPassword = {
    actual: '',
    nueva: '',
    confirmar: ''
  };

  // Seguridad
  dispositivos = signal<any[]>([]);
  sesionActiva = signal<any>(null);
  cargandoSeguridad = signal(false);

  get userData() { return this.authService.currentUserData(); }
  get userPhotoUrl(): string | null {
    const local = this.authService.profilePhotoUrl();
    if (local) return `${this.baseUrl}/api/v1/archivos${local}`;
    return null;
  }
  get nombreCompletoConstruido(): string {
    return `${this.form.nombres} ${this.form.apellidoPaterno} ${this.form.apellidoMaterno}`.trim().replace(/\s+/g, ' ');
  }
  get userInitials(): string {
    const name = this.nombreCompletoConstruido || 'US';
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
    this.form.email = this.userData?.sub || '';
    
    const full = this.userData?.nombreCompleto || '';
    const parts = full.split(' ');
    if (parts.length > 0) this.form.nombres = parts[0];
    if (parts.length > 1) this.form.apellidoPaterno = parts[1];
    if (parts.length > 2) this.form.apellidoMaterno = parts.slice(2).join(' ');

    if (this.isCliente) {
      this.cargando.set(true);
      this.clienteService.obtenerPerfil().subscribe({
        next: (c) => {
          this.clienteData.set(c);
          this.cargando.set(false);
          if (c.fotoUrl) this.authService.updateProfilePhoto(c.fotoUrl);
          
          if (c.datosSolicitud) {
            try {
              const d = JSON.parse(c.datosSolicitud);
              if (d.nombres) this.form.nombres = d.nombres;
              if (d.apellidoPaterno) this.form.apellidoPaterno = d.apellidoPaterno;
              if (d.apellidoMaterno) this.form.apellidoMaterno = d.apellidoMaterno;
            } catch(e) {}
          }
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

    this.cargarDatosSeguridad();
  }

  setTab(tab: 'personal' | 'seguridad' | 'sesion' | 'dispositivos') {
    this.activeTab.set(tab);
    this.clearMessages();
  }

  cargarDatosSeguridad() {
    this.cargandoSeguridad.set(true);
    this.authService.getSesionActiva().subscribe({
      next: (s) => this.sesionActiva.set(s),
      error: () => {}
    });

    this.authService.getDispositivosConfiables().subscribe({
      next: (d) => {
        this.dispositivos.set(d);
        this.cargandoSeguridad.set(false);
      },
      error: () => this.cargandoSeguridad.set(false)
    });
  }

  revocarDispositivo(id: number) {
    if (!confirm('¿Estás seguro de revocar la confianza de este dispositivo? Se pedirá código 2FA la próxima vez.')) return;
    this.authService.revocarDispositivo(id).subscribe({
      next: () => {
        this.cargarDatosSeguridad();
        this.mensajeExito.set('Dispositivo revocado exitosamente.');
      },
      error: () => this.mensajeError.set('Error al revocar el dispositivo.')
    });
  }

  async registrarPasskey() {
    this.clearMessages();
    try {
      const optionsJson = await this.authService.getOpcionesRegistroPasskey().toPromise();
      const options = WebAuthnUtils.parseCreationOptions(JSON.stringify(optionsJson));
      const credential = await navigator.credentials.create({ publicKey: options }) as PublicKeyCredential;
      const responseJson = WebAuthnUtils.serializeRegistrationResponse(credential);
      await this.authService.verificarRegistroPasskey(responseJson).toPromise();

      this.mensajeExito.set('¡Dispositivo biométrico (Passkey) registrado correctamente!');
    } catch (err) {
      console.error(err);
      this.mensajeError.set('No se pudo registrar el Passkey. Asegúrate de que tu dispositivo sea compatible y no hayas cancelado.');
    }
  }

  guardarDatos() {
    if (!this.form.nombres.trim() || !this.form.apellidoPaterno.trim()) return;
    this.guardandoDatos.set(true);
    this.clearMessages();

    if (this.isCliente) {
      const extra = {
        nombres: this.form.nombres,
        apellidoPaterno: this.form.apellidoPaterno,
        apellidoMaterno: this.form.apellidoMaterno
      };
      const payload: any = {
        nombreCompleto: this.nombreCompletoConstruido,
        email: this.form.email,
        datosSolicitud: JSON.stringify(extra)
      };

      this.clienteService.actualizarPerfilPropio(payload).subscribe({
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
        nombreCompleto: this.nombreCompletoConstruido,
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

  cambiarContrasena() {
    this.clearMessages();
    
    if (!this.formPassword.actual || !this.formPassword.nueva || !this.formPassword.confirmar) {
      this.mensajeError.set('Por favor completa todos los campos.');
      return;
    }

    if (this.formPassword.nueva !== this.formPassword.confirmar) {
      this.mensajeError.set('Las contraseñas no coinciden.');
      return;
    }

    this.cambiandoPassword.set(true);

    this.authService.cambiarContrasena(this.formPassword.actual, this.formPassword.nueva).subscribe({
      next: () => {
        this.cambiandoPassword.set(false);
        this.mensajeExito.set('Contraseña actualizada exitosamente.');
        this.formPassword = { actual: '', nueva: '', confirmar: '' };
      },
      error: (err) => {
        this.cambiandoPassword.set(false);
        this.mensajeError.set(err.error?.error || err.error?.mensaje || 'Error al cambiar la contraseña.');
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
