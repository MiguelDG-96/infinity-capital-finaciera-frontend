import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TasasService } from '../../../../core/services/tasas.service';
import { TipoCredito, RangoInteres } from '../../../../core/models/tasas.model';
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

  // Modal State
  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedTipoId: number | null = null;
  editingRango: RangoInteres | null = null;
  
  // Form State
  rangoForm: RangoInteres = {
    montoMinimo: 0,
    montoMaximo: 0,
    tasaMensual: 0
  };

  constructor(private tasasService: TasasService) {}

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

  actualizarTemDefecto(tipo: TipoCredito): void {
    const nuevoTem = prompt('Ingrese la nueva TEM por defecto (%)', tipo.temDefecto.toString());
    if (nuevoTem === null) return;

    const temNum = parseFloat(nuevoTem);
    if (isNaN(temNum)) {
      alert('Por favor ingrese un número válido');
      return;
    }

    this.loading.set(true);
    this.tasasService.updateTipoCredito(tipo.id, {
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      activo: tipo.activo,
      temDefecto: temNum
    }).pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.cargarTipos(),
        error: () => alert('Error al actualizar la tasa')
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
      alert('El monto mínimo debe ser menor al máximo');
      return;
    }

    this.loading.set(true);
    
    if (this.modalMode === 'create') {
      this.tasasService.crearRango(this.rangoForm)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.cerrarModal();
            this.cargarTipos();
          },
          error: (err) => {
            const msg = err.error?.error || 'Error al crear el rango';
            alert(msg);
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
                  this.cerrarModal();
                  this.cargarTipos();
                },
                error: () => alert('Error al recrear el rango')
              });
          },
          error: () => {
            this.loading.set(false);
            alert('Error al actualizar el rango (fase eliminación)');
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
        next: () => this.cargarTipos(),
        error: () => alert('Error al eliminar el rango')
      });
  }
}
