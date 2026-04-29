import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TrabajadorService } from '../../../../core/services/trabajador.service';
import { RolService } from '../../../../core/services/rol.service';
import { Trabajador, TrabajadorRequest } from '../../../../core/models/trabajador.model';
import { ToastService } from '../../../../core/services/toast.service';
import { Rol } from '../../../../core/models/rol.model';

@Component({
  selector: 'app-admin-personal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-personal.component.html'
})
export class AdminPersonalComponent implements OnInit {
  private trabajadorService = inject(TrabajadorService);
  private rolService = inject(RolService);
  private toastService = inject(ToastService);

  trabajadores = signal<Trabajador[]>([]);
  roles = signal<Rol[]>([]);
  isLoading = signal<boolean>(true);
  
  // Modal State
  mostrarModal = signal<boolean>(false);
  editandoId = signal<number | null>(null);

  form: TrabajadorRequest = this.resetForm();

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading.set(true);
    this.trabajadorService.listar().subscribe({
      next: (data) => {
        this.trabajadores.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show('Error al cargar personal', 'error');
        this.isLoading.set(false);
      }
    });

    this.rolService.listar().subscribe(data => {
      // Solo roles administrativos para el personal
      this.roles.set(data.filter(r => r.nombre !== 'ROLE_CLIENTE'));
    });
  }

  abrirModal(t?: Trabajador) {
    if (t) {
      this.editandoId.set(t.trabajadorId);
      this.form = {
        nombreCompleto: t.nombreCompleto,
        email: t.email,
        dni: t.dni,
        cargo: t.cargo,
        salario: t.salario,
        fechaContratacion: t.fechaContratacion,
        tipoContrato: t.tipoContrato,
        contratoActivo: t.contratoActivo,
        rolId: this.roles().find(r => r.nombre === t.rol)?.id || 0
      };
    } else {
      this.editandoId.set(null);
      this.form = this.resetForm();
    }
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }

  guardar() {
    if (!this.form.rolId) {
      this.toastService.show('Seleccione un rol válido', 'warning');
      return;
    }

    const obs = this.editandoId()
      ? this.trabajadorService.actualizar(this.editandoId()!, this.form)
      : this.trabajadorService.crear(this.form);

    obs.subscribe({
      next: () => {
        this.toastService.show(this.editandoId() ? 'Personal actualizado' : 'Nuevo trabajador registrado', 'success');
        this.cerrarModal();
        this.cargarDatos();
      },
      error: (err) => {
        this.toastService.show(err.error?.mensaje || 'Error al procesar solicitud', 'error');
      }
    });
  }

  toggleEstado(t: Trabajador) {
    this.trabajadorService.cambiarEstado(t.usuarioId, !t.habilitado).subscribe({
      next: () => {
        this.toastService.show('Estado de cuenta actualizado', 'info');
        this.cargarDatos();
      }
    });
  }

  private resetForm(): TrabajadorRequest {
    return {
      nombreCompleto: '',
      email: '',
      dni: '',
      cargo: '',
      salario: 0,
      fechaContratacion: new Date().toISOString().split('T')[0],
      tipoContrato: 'PLAZO_FIJO',
      contratoActivo: true,
      rolId: 0
    };
  }
}
