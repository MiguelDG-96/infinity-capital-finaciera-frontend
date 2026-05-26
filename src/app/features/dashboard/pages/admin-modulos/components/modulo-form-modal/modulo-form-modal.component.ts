import { Component, input, output, inject, signal, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModuloService } from '../../../../../../core/services/modulo.service';
import { Modulo } from '../../../../../../core/models/modulo.model';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../../../../../../core/services/toast.service';

@Component({
  selector: 'app-modulo-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './modulo-form-modal.component.html'
})
export class ModuloFormModalComponent {
  private moduloService = inject(ModuloService);
  private toastService = inject(ToastService);

  // Input Signal (Angular 21)
  modulo = input<Modulo | null>(null);
  
  close = output<void>();
  save = output<void>();

  /**
   * LinkedSignal (Novedad Angular 19/21): 
   * Sincroniza automáticamente el estado del formulario con el input 'modulo'.
   * Si 'modulo' cambia, el formulario se reinicia con los nuevos valores.
   */
  form = linkedSignal(() => {
    const mod = this.modulo();
    return {
      id: mod?.id,
      nombre: mod?.nombre || '',
      ruta: mod?.ruta || '',
      descripcion: mod?.descripcion || '',
      icono: this.cleanIcon(mod?.icono),
      orden: mod?.orden || null
    };
  });

  isSubmitting = signal<boolean>(false);
  isPickerOpen = signal<boolean>(false);

  readonly LUCIDE_CATALOG = [
    'briefcase', 'wallet', 'credit-card', 'bar-chart', 'pie-chart', 'activity', 'trending-up', 'trending-down', 
    'home', 'landmark', 'search', 'shield', 'lock', 'key', 'settings', 'wrench', 
    'package', 'truck', 'users', 'user', 'building', 'layers', 'globe', 'zap', 
    'lightbulb', 'clock', 'file-text', 'calendar', 'message-square', 'bell', 
    'rocket', 'star', 'map-pin', 'folder', 'laptop', 'smartphone', 'shopping-cart', 'box'
  ];

  private cleanIcon(icon: string | undefined): string {
    if (!icon) return 'box';
    return icon.replace('fas fa-', '').replace('fa-', '').trim() || 'box';
  }

  togglePicker() {
    this.isPickerOpen.update(v => !v);
  }

  selectIcon(icon: string) {
    // Actualizamos el LinkedSignal
    this.form.update(current => ({ ...current, icono: icon }));
    this.isPickerOpen.set(false);
  }

  closeModal() {
    this.close.emit();
  }

  onSubmit() {
    const currentForm = this.form();
    if (!currentForm.nombre || !currentForm.ruta) {
      this.toastService.show('Nombre y Ruta son obligatorios', 'warning');
      return;
    }

    this.isSubmitting.set(true);
    const isEdicion = !!currentForm.id;
    const payload = { ...currentForm } as Modulo;

    const request$ = isEdicion 
      ? this.moduloService.actualizar(currentForm.id as number, payload)
      : this.moduloService.crear(payload);

    request$.subscribe({
      next: () => {
        this.toastService.show(isEdicion ? 'Módulo Reestructurado' : 'Módulo en Producción', 'success');
        this.isSubmitting.set(false);
        this.save.emit();
      },
      error: () => {
        this.toastService.show('Error al guardar', 'error');
        this.isSubmitting.set(false);
      }
    });
  }
}
