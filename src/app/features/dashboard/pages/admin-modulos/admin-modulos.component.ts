import { Component, signal, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuloService } from '../../../../core/services/modulo.service';
import { Modulo } from '../../../../core/models/modulo.model';
import { LucideAngularModule } from 'lucide-angular';
import { ModuloFormModalComponent } from './components/modulo-form-modal/modulo-form-modal.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-modulos',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ModuloFormModalComponent],
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

  eliminarModulo(id: number | undefined) {
    if (!id) return;
    if (confirm(`¿Ejecutar borrado en cascada del módulo #${id}?\nADVERTENCIA: Destruirá la tabla de permisos RBAC atados al rol.`)) {
      this.moduloService.eliminar(id).subscribe({
        next: () => {
          this.toastService.show('Módulo Desintegrado Globalmente', 'success');
          this.cargarModulos(true);
        },
        error: () => {
          this.toastService.show('Falla al borrar: Verifique dependencias', 'error');
        }
      });
    }
  }
}
