import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TasasService } from '../../../../core/services/tasas.service';
import { TipoCredito, RangoInteres, TipoCreditoRequest } from '../../../../core/models/tasas.model';
import { ToastService } from '../../../../core/services/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-gestion-tasas',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './gestion-tasas.component.html',
  styleUrl: './gestion-tasas.component.css'
})
export class GestionTasasComponent implements OnInit {
  tiposCredito = signal<TipoCredito[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Modal Rango State
  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedTipoId: number | null = null;
  editingRango: RangoInteres | null = null;
  
  // Modal TipoCredito State
  isTipoModalOpen = false;
  modalTipoMode: 'create' | 'edit' = 'create';
  selectedTipoEditId: number | null = null;

  // Delete Confirmation State
  tipoToDelete = signal<number | null>(null);

  // Form State Rango
  rangoForm: RangoInteres = {
    montoMinimo: 0,
    montoMaximo: 0,
    tasaMensual: 0
  };

  // Form State TipoCredito
  tipoForm: TipoCreditoRequest = {
    nombre: '',
    descripcion: '',
    icono: 'box',
    activo: true,
    temDefecto: 0
  };

  isPickerOpen = signal<boolean>(false);

  readonly LUCIDE_CATALOG = [
    'briefcase', 'wallet', 'credit-card', 'bar-chart', 'pie-chart', 'activity', 'trending-up', 'trending-down', 
    'home', 'landmark', 'search', 'shield', 'lock', 'key', 'settings', 'wrench', 
    'package', 'truck', 'users', 'user', 'building', 'layers', 'globe', 'zap', 
    'lightbulb', 'clock', 'file-text', 'calendar', 'message-square', 'bell', 
    'rocket', 'star', 'map-pin', 'folder', 'laptop', 'smartphone', 'shopping-cart', 'box', 'banknote', 'graduation-cap', 'coins'
  ];

  togglePicker() {
    this.isPickerOpen.update(v => !v);
  }

  selectIcon(icon: string) {
    this.tipoForm.icono = icon;
    this.isPickerOpen.set(false);
  }

  constructor(
    private tasasService: TasasService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarTipos();
  }

  cargarTipos(): void {
    this.loading.set(true);
    this.error.set(null);
    this.tasasService.getTiposCredito()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (tipos) => this.tiposCredito.set(tipos),
        error: (err) => {
          console.error(err);
          this.error.set('Error al cargar tipos de crédito');
        }
      });
  }

  abrirModalNuevoTipo(): void {
    this.modalTipoMode = 'create';
    this.selectedTipoEditId = null;
    this.tipoForm = {
      nombre: '',
      descripcion: '',
      icono: 'box',
      activo: true,
      temDefecto: 0
    };
    this.isTipoModalOpen = true;
  }

  abrirModalEditarTipo(tipo: TipoCredito): void {
    this.modalTipoMode = 'edit';
    this.selectedTipoEditId = tipo.id;
    this.tipoForm = {
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      icono: tipo.icono || 'box',
      activo: tipo.activo,
      temDefecto: tipo.temDefecto
    };
    this.isTipoModalOpen = true;
  }

  cerrarTipoModal(): void {
    this.isTipoModalOpen = false;
    this.selectedTipoEditId = null;
  }

  guardarTipoCredito(): void {
    if (!this.tipoForm.nombre || this.tipoForm.temDefecto <= 0) {
      this.toastService.show('Complete los campos obligatorios y asegúrese de que la tasa sea mayor a 0', 'warning');
      return;
    }

    this.loading.set(true);

    if (this.modalTipoMode === 'create') {
      this.tasasService.crearTipoCredito(this.tipoForm)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.toastService.show('Tipo de crédito creado exitosamente', 'success');
            this.cerrarTipoModal();
            this.cargarTipos();
          },
          error: (err) => this.toastService.show(err.error?.error || 'Error al crear el tipo de crédito', 'error')
        });
    } else {
      if (!this.selectedTipoEditId) return;
      this.tasasService.updateTipoCredito(this.selectedTipoEditId, this.tipoForm)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.toastService.show('Tipo de crédito actualizado', 'success');
            this.cerrarTipoModal();
            this.cargarTipos();
          },
          error: (err) => this.toastService.show(err.error?.error || 'Error al actualizar el tipo de crédito', 'error')
        });
    }
  }

  abrirConfirmacionTipo(id: number): void {
    this.tipoToDelete.set(id);
  }

  cerrarConfirmacionTipo(): void {
    this.tipoToDelete.set(null);
  }

  confirmarEliminacionTipo(): void {
    const id = this.tipoToDelete();
    if (!id) return;

    this.loading.set(true);
    this.tasasService.eliminarTipoCredito(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.toastService.show('Tipo de crédito eliminado correctamente', 'success');
          this.cargarTipos();
          this.cerrarConfirmacionTipo();
        },
        error: () => {
          this.toastService.show('Error al eliminar. Es posible que esté en uso.', 'error');
          this.cerrarConfirmacionTipo();
        }
      });
  }

  abrirModalNuevoRango(tipoId: number): void {
    this.selectedTipoId = tipoId;
    this.modalMode = 'create';
    this.rangoForm = {
      montoMinimo: 0,
      montoMaximo: 0,
      tasaMensual: 0,
      tipoCreditoId: tipoId
    };
    this.isModalOpen = true;
  }

  abrirModalEditarRango(tipoId: number, rango: RangoInteres): void {
    this.selectedTipoId = tipoId;
    this.modalMode = 'edit';
    this.editingRango = rango;
    this.rangoForm = { ...rango };
    this.isModalOpen = true;
  }

  cerrarModal(): void {
    this.isModalOpen = false;
    this.editingRango = null;
  }

  guardarRango(): void {
    if (this.rangoForm.montoMinimo >= this.rangoForm.montoMaximo) {
      this.toastService.show('El monto mínimo debe ser menor al máximo', 'warning');
      return;
    }

    this.loading.set(true);
    
    if (this.modalMode === 'create') {
      this.tasasService.crearRango(this.rangoForm)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.toastService.show('Rango de interés creado', 'success');
            this.cerrarModal();
            this.cargarTipos();
          },
          error: (err) => {
            const msg = err.error?.error || 'Error al crear el rango';
            this.toastService.show(msg, 'error');
          }
        });
    } else {
      // "Actualizar" simulado: eliminar y crear nuevo (debido a falta de endpoint PUT en backend)
      // Primero eliminamos el anterior
      if (!this.editingRango?.id) return;
      
      this.tasasService.eliminarRango(this.editingRango.id)
        .subscribe({
          next: () => {
            this.tasasService.crearRango(this.rangoForm)
              .pipe(finalize(() => this.loading.set(false)))
              .subscribe({
                next: () => {
                  this.toastService.show('Rango de interés actualizado', 'success');
                  this.cerrarModal();
                  this.cargarTipos();
                },
                error: () => this.toastService.show('Error al recrear el rango', 'error')
              });
          },
          error: () => {
            this.loading.set(false);
            this.toastService.show('Error al actualizar el rango (fase eliminación)', 'error');
          }
        });
    }
  }

  eliminarRango(id: number | undefined): void {
    if (!id) return;
    if (!confirm('¿Está seguro de eliminar este rango?')) return;

    this.loading.set(true);
    this.tasasService.eliminarRango(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.toastService.show('Rango de interés eliminado', 'success');
          this.cargarTipos();
        },
        error: () => this.toastService.show('Error al eliminar el rango', 'error')
      });
  }
}
