import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { IpSeguridadService, IpListaBlanca, IpListaNegra, HistorialConexion } from '../../../../core/services/ip-seguridad.service';

@Component({
  selector: 'app-admin-ips',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [DatePipe],
  templateUrl: './admin-ips.component.html'
})
export class AdminIpsComponent implements OnInit {
  private ipService = inject(IpSeguridadService);

  activeTab = signal<'blanca' | 'negra' | 'historial'>('blanca');
  
  listaBlanca = signal<IpListaBlanca[]>([]);
  listaNegra = signal<IpListaNegra[]>([]);
  historial = signal<HistorialConexion[]>([]);
  
  cargando = signal(false);
  mensajeExito = signal<string | null>(null);
  mensajeError = signal<string | null>(null);

  // Formulario Lista Blanca
  mostrarModalBlanca = signal(false);
  formBlanca = { ip: '', alias: '', notas: '' };

  ngOnInit() {
    this.cargarDatosActuales();
  }

  setTab(tab: 'blanca' | 'negra' | 'historial') {
    this.activeTab.set(tab);
    this.cargarDatosActuales();
  }

  cargarDatosActuales() {
    this.cargando.set(true);
    this.clearMessages();
    const tab = this.activeTab();

    if (tab === 'blanca') {
      this.ipService.obtenerListaBlanca().subscribe({
        next: (data) => { this.listaBlanca.set(data); this.cargando.set(false); },
        error: () => this.handleError()
      });
    } else if (tab === 'negra') {
      this.ipService.obtenerListaNegra().subscribe({
        next: (data) => { this.listaNegra.set(data); this.cargando.set(false); },
        error: () => this.handleError()
      });
    } else {
      this.ipService.obtenerHistorial().subscribe({
        next: (data) => { this.historial.set(data); this.cargando.set(false); },
        error: () => this.handleError()
      });
    }
  }

  // --- Acciones Lista Blanca ---
  abrirModalBlanca() {
    this.formBlanca = { ip: '', alias: '', notas: '' };
    this.mostrarModalBlanca.set(true);
  }

  abrirModalBlancaDesdeHistorial(ip: string) {
    this.formBlanca = { ip: ip, alias: '', notas: '' };
    this.mostrarModalBlanca.set(true);
  }

  guardarListaBlanca() {
    if (!this.formBlanca.ip || !this.formBlanca.alias) return;
    this.cargando.set(true);
    this.ipService.agregarAListaBlanca(this.formBlanca.ip, this.formBlanca.alias, this.formBlanca.notas).subscribe({
      next: () => {
        this.mostrarModalBlanca.set(false);
        this.mensajeExito.set('IP agregada a la lista blanca exitosamente.');
        this.cargarDatosActuales();
      },
      error: (err) => {
        this.cargando.set(false);
        this.mensajeError.set(err.error?.mensaje || 'Error al agregar IP');
      }
    });
  }

  eliminarDeListaBlanca(id: number) {
    if (!confirm('¿Seguro de remover esta IP de la lista blanca?')) return;
    this.ipService.eliminarDeListaBlanca(id).subscribe({
      next: () => {
        this.mensajeExito.set('IP removida exitosamente.');
        this.cargarDatosActuales();
      },
      error: () => this.handleError()
    });
  }

  // --- Acciones Lista Negra ---
  desbloquearIp(ip: string) {
    if (!confirm(`¿Seguro de desbloquear la IP ${ip}?`)) return;
    this.ipService.desbloquearIp(ip).subscribe({
      next: () => {
        this.mensajeExito.set('IP desbloqueada exitosamente.');
        this.cargarDatosActuales();
      },
      error: () => this.handleError()
    });
  }

  private handleError() {
    this.cargando.set(false);
    this.mensajeError.set('Ocurrió un error al cargar o procesar los datos.');
  }

  private clearMessages() {
    this.mensajeExito.set(null);
    this.mensajeError.set(null);
  }
}
