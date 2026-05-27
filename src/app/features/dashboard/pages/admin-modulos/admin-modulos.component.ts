import { Component, signal, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuloService } from '../../../../core/services/modulo.service';
import { Modulo } from '../../../../core/models/modulo.model';
import { LucideAngularModule } from 'lucide-angular';
import { ModuloFormModalComponent } from './components/modulo-form-modal/modulo-form-modal.component';
import { ToastService } from '../../../../core/services/toast.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-admin-modulos',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ModuloFormModalComponent, DragDropModule],
  templateUrl: './admin-modulos.component.html'
})
export class AdminModulosComponent implements OnInit {
  private moduloService = inject(ModuloService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  modulos = signal<Modulo[]>([]);
  isLoading = signal<boolean>(true);

  // Modal State
  selectedModulo = signal<Modulo | null>(null);
  isModalOpen = signal<boolean>(false);

  // Delete Confirmation State
  moduloToDelete = signal<number | null>(null);

  // Debounce Timer
  private saveTimer: any = null;

  // Fallback for legacy database emojis
  getSafeIcon(icono: string | undefined | null): string {
    if (!icono) return 'layers';
    if (/^[a-zA-Z-]+$/.test(icono)) return icono;
    return 'layers'; 
  }

  ngOnInit() {
    this.cargarModulos();
  }

  cargarModulos(silent: boolean = false) {
    if (!silent) this.isLoading.set(true);
    
    this.moduloService.listar().subscribe({
      next: (data) => {
        this.modulos.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show('Error al cargar módulos', 'error');
        this.isLoading.set(false);
      }
    });
  }

  abrirModal(modulo?: Modulo) {
    this.selectedModulo.set(modulo || null);
    this.isModalOpen.set(true);
  }

  cerrarModal() {
    this.selectedModulo.set(null);
    this.isModalOpen.set(false);
  }

  onModuloGuardado() {
    this.cerrarModal();
    this.cargarModulos(true);
  }

  drop(event: CdkDragDrop<Modulo[]>) {
    const currentModulos = [...this.modulos()];
    moveItemInArray(currentModulos, event.previousIndex, event.currentIndex);
    
    // Optimistic UI update
    this.modulos.set(currentModulos);

    // Prepare payload
    const payload = currentModulos.map((m, index) => ({
      id: m.id!,
      orden: index + 1
    }));

    // Debounce the backend call to prevent spamming
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      this.moduloService.reordenarModulos(payload).subscribe({
        next: () => {
          this.toastService.show('Orden guardado en la nube', 'success');
        },
        error: () => {
          this.toastService.show('Error al guardar el nuevo orden', 'error');
          this.cargarModulos(true); // Revert on actual error
        }
      });
    }, 5000); // 5 seconds delay
  }

  abrirConfirmacion(id: number | undefined) {
    if (id) this.moduloToDelete.set(id);
  }

  cerrarConfirmacion() {
    this.moduloToDelete.set(null);
  }

  confirmarEliminacion() {
    const id = this.moduloToDelete();
    if (!id) return;
    
    this.moduloService.eliminar(id).subscribe({
      next: () => {
        this.toastService.show('Módulo Desintegrado Globalmente', 'success');
        this.cargarModulos(true);
        this.cerrarConfirmacion();
      },
      error: () => {
        this.toastService.show('Falla al borrar: Verifique dependencias', 'error');
        this.cerrarConfirmacion();
      }
    });
  }
}
