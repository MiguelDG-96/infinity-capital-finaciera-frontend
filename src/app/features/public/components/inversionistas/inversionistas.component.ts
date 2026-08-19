import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CheckCircle2, ChevronDown, ShieldCheck, TrendingUp, Building, ArrowRight, X, FileChartColumn, ChartNoAxesCombined } from 'lucide-angular';
import { Router } from '@angular/router';
import { InversionistaProspectoService } from '../../../../core/services/inversionista-prospecto.service';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-inversionistas',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './inversionistas.component.html',
  styleUrl: './inversionistas.component.css'
})
export class InversionistasComponent {
  private router = inject(Router);
  private prospectoService = inject(InversionistaProspectoService);
  private cdr = inject(ChangeDetectorRef);
  
  readonly CheckCircle2 = CheckCircle2;
  readonly ChevronDown = ChevronDown;
  readonly ShieldCheck = ShieldCheck;
  readonly TrendingUp = TrendingUp;
  readonly Building = Building;
  readonly ArrowRight = ArrowRight;
  readonly FileChartColumn = FileChartColumn;
  readonly ChartNoAxesCombined = ChartNoAxesCombined;
  readonly X = X;
  
  isModalOpen = false;
  isSubmitting = false;
  isSuccess = false;

  formData = {
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    dni: '',
    email: '',
    telefono: '',
    montoInversion: '',
    plazo: '12'
  };

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    setTimeout(() => {
      this.isSuccess = false;
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }, 300); // Reset after closing animation
  }

  onSubmitForm() {
    this.isSubmitting = true;
    this.cdr.detectChanges();
    
    const payload = {
      ...this.formData,
      montoInversion: Number(this.formData.montoInversion)
    };

    this.prospectoService.crearProspecto(payload)
      .pipe(
        timeout(10000), // Si el servidor no responde en 10s, lanza error
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.isSuccess = true;
          this.formData = {
            nombres: '',
            apellidoPaterno: '',
            apellidoMaterno: '',
            dni: '',
            email: '',
            telefono: '',
            montoInversion: '',
            plazo: '12'
          };
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert('Hubo un error de conexión al enviar tu solicitud (Error 500/401). Verifica que el Backend de Java esté corriendo con los últimos cambios.');
          console.error('Error al guardar prospecto', err);
          this.cdr.detectChanges();
        }
      });
  }
}

