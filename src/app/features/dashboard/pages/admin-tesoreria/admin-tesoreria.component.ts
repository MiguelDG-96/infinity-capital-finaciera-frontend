import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TesoreriaService, SolicitudRetiroTesoreria } from '../../../../core/services/tesoreria.service';

@Component({
  selector: 'app-admin-tesoreria',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-tesoreria.component.html',
  styleUrl: './admin-tesoreria.component.css',
})
export class AdminTesoreriaComponent implements OnInit {
  retiros: SolicitudRetiroTesoreria[] = [];
  desembolsos: any[] = [];
  tabActiva: 'retiros' | 'desembolsos' = 'retiros';
  cargando = true;
  error = '';
  procesando = false;

  // Modales
  showProcesarModal = false;
  showDesembolsoModal = false;
  retiroSeleccionado: SolicitudRetiroTesoreria | null = null;
  desembolsoSeleccionado: any | null = null;
  
  // Formulario del modal
  numeroOperacion = '';
  estadoResolucion: 'aprobar' | 'rechazar' = 'aprobar';
  motivoRechazo = '';

  constructor(
    private tesoreriaService: TesoreriaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargarRetiros();
    this.cargarDesembolsos();
  }

  setTab(tab: 'retiros' | 'desembolsos'): void {
    this.tabActiva = tab;
  }

  cargarRetiros(): void {
    this.cargando = true;
    this.error = '';
    this.tesoreriaService.obtenerRetirosPendientes().subscribe({
      next: (data) => {
        this.retiros = data;
        if (this.tabActiva === 'retiros') this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (this.tabActiva === 'retiros') {
          this.error = 'Error al cargar los retiros de tesorería.';
          this.cargando = false;
        }
        this.cdr.detectChanges();
      }
    });
  }

  cargarDesembolsos(): void {
    this.cargando = true;
    this.tesoreriaService.obtenerDesembolsosPendientes().subscribe({
      next: (data) => {
        this.desembolsos = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar los desembolsos pendientes.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarProcesamiento(retiro: SolicitudRetiroTesoreria): void {
    if (this.procesando) return;
    this.retiroSeleccionado = retiro;
    this.numeroOperacion = '';
    this.estadoResolucion = 'aprobar';
    this.motivoRechazo = '';
    this.showProcesarModal = true;
  }

  cerrarModal(): void {
    this.showProcesarModal = false;
    this.showDesembolsoModal = false;
    this.retiroSeleccionado = null;
    this.desembolsoSeleccionado = null;
  }

  confirmarProcesamiento(): void {
    if (!this.retiroSeleccionado || this.procesando) return;
    
    if (this.estadoResolucion === 'aprobar' && !this.numeroOperacion.trim()) {
      alert('Debe ingresar un número de operación válido.');
      return;
    }
    
    if (this.estadoResolucion === 'rechazar' && !this.motivoRechazo.trim()) {
      alert('Debe ingresar un motivo para el rechazo.');
      return;
    }

    this.procesando = true;
    const req = {
      numeroOperacion: this.numeroOperacion,
      aprobado: this.estadoResolucion === 'aprobar',
      motivoRechazo: this.motivoRechazo
    };

    this.tesoreriaService.procesarRetiro(this.retiroSeleccionado.id, req).subscribe({
      next: () => {
        this.procesando = false;
        this.cerrarModal();
        this.cargarRetiros();
      },
      error: (err) => {
        this.procesando = false;
        alert(err.error?.error || 'Ocurrió un error al procesar el retiro.');
      }
    });
  }

  iniciarDesembolso(desembolso: any): void {
    if (this.procesando) return;
    this.desembolsoSeleccionado = desembolso;
    this.showDesembolsoModal = true;
  }

  confirmarDesembolso(): void {
    if (!this.desembolsoSeleccionado || this.procesando) return;
    
    this.procesando = true;
    this.tesoreriaService.procesarDesembolso(this.desembolsoSeleccionado.creditoId).subscribe({
      next: () => {
        this.procesando = false;
        this.cerrarModal();
        this.cargarDesembolsos();
        // Opcional: mostrar notificación de éxito
      },
      error: (err) => {
        this.procesando = false;
        alert(err.error?.error || 'Error al procesar el desembolso.');
      }
    });
  }
}
