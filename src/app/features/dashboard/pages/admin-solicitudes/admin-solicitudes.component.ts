// src/app/features/dashboard/pages/admin-solicitudes/admin-solicitudes.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditoService } from '../../../../core/services/credito.service';
import { SolicitudPendiente } from '../../../../core/models/credito.model';
import { EvaluarSolicitudModalComponent } from '../../components/evaluar-solicitud-modal/evaluar-solicitud-modal.component';

@Component({
  selector: 'app-admin-solicitudes',
  standalone: true,
  imports: [CommonModule, EvaluarSolicitudModalComponent],
  templateUrl: './admin-solicitudes.component.html',
  styleUrl: './admin-solicitudes.component.css'
})
export class AdminSolicitudesComponent implements OnInit {
  solicitudes: SolicitudPendiente[] = [];
  cargando = true;
  error = '';
  
  solicitudSeleccionada: SolicitudPendiente | null = null;
  modalAbierto = false;

  constructor(
    private creditoService: CreditoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    this.creditoService.listarSolicitudesPendientes().subscribe({
      next: (data) => {
        this.solicitudes = data;
        this.cargando = false;
        this.cdr.detectChanges(); // Fuerza la actualización para repintar y ocultar el spinner
      },
      error: (err) => {
        this.error = 'Error al cargar las solicitudes pendientes.';
        this.cargando = false;
        this.cdr.detectChanges(); // Fuerza la actualización para repintar y mostrar el error
        console.error(err);
      }
    });
  }

  abrirModalEvaluacion(solicitud: SolicitudPendiente): void {
    this.solicitudSeleccionada = solicitud;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.solicitudSeleccionada = null;
  }

  alFinalizarEvaluacion(): void {
    this.cerrarModal();
    this.cargarSolicitudes(); // Recargar la lista
  }
}
