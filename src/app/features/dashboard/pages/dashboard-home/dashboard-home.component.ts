// src/app/features/dashboard/pages/dashboard-home/dashboard-home.component.ts

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BilleteraService } from '../../../../core/services/billetera.service';
import { CreditoService } from '../../../../core/services/credito.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TesoreriaService } from '../../../../core/services/tesoreria.service';
import { TransaccionVirtual, CuentaVirtual } from '../../../../core/models/billetera.model';
import { Credito } from '../../../../core/models/credito.model';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { QrModalComponent } from '../../../../shared/components/qr-modal/qr-modal.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, QrModalComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css',
})
export class DashboardHomeComponent implements OnInit {
  private billeteraService = inject(BilleteraService);
  private creditoService = inject(CreditoService);
  private authService = inject(AuthService); // Inyectamos Auth para sacar el Rol

  saldo = signal<CuentaVirtual | null>(null);
  transacciones = signal<TransaccionVirtual[]>([]);
  creditos = signal<Credito[]>([]);
  cargando = signal(true);
  
  // isAdmin ahora es un computed, lo que evita errores de ciclo de detección
  isAdmin = computed(() => {
    const user = this.authService.currentUserData();
    if (!user) return false;
    const rolesAdmin = ['ADMIN', 'ROLE_ADMIN', 'TRABAJADOR', 'ROLE_TRABAJADOR'];
    return rolesAdmin.includes(user.rol);
  });

  // Métricas Admin
  totalCartera = signal(0);
  solicitudesPendientes = signal(0);
  retirosPendientes = signal(0);
  numCreditosActivos = signal(0);

  // QR Modal
  showQrModal = signal(false);
  qrToGenerate = signal('https://infiny-capital.com');

  private tesoreriaService = inject(TesoreriaService);

  ngOnInit() {
    // Escuchamos el cambio de isAdmin de forma reactiva
    if (this.isAdmin()) {
      this.cargarMetricasAdmin();
    } else {
      this.cargarResumen();
    }
  }

  cargarMetricasAdmin() {
    this.cargando.set(true);
    forkJoin({
      cartera: this.creditoService.obtenerCarteraGeneral(),
      solicitudes: this.creditoService.listarSolicitudesPendientes(),
      retiros: this.tesoreriaService.obtenerRetirosPendientes()
    }).subscribe({
      next: (res) => {
        this.totalCartera.set(res.cartera.reduce((sum, c) => sum + (c.montoAprobado || c.montoCredito), 0));
        this.numCreditosActivos.set(res.cartera.filter(c => c.estado === 'ACTIVO').length);
        this.solicitudesPendientes.set(res.solicitudes.length);
        this.retirosPendientes.set(res.retiros.length);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  cargarResumen() {
    this.cargando.set(true);
    
    // Cargar Saldo
    this.billeteraService.obtenerMiSaldo().subscribe(s => this.saldo.set(s));
    
    // Cargar últimas 4 transacciones
    this.billeteraService.listarTransacciones().subscribe(t => {
      this.transacciones.set(t.slice(0, 4));
    });

    // Cargar créditos activos
    this.creditoService.obtenerMisCreditos().subscribe(c => {
      this.creditos.set(c.filter(item => item.estado === 'ACTIVO' || item.estado === 'MORA'));
      this.cargando.set(false);
    });
  }

  getProximoPago(): any {
    const activo = this.creditos()[0];
    if (!activo || !activo.cuotas) return null;
    return activo.cuotas.find(q => q.estadoCuota === 'PENDIENTE' || q.estadoCuota === 'MORA');
  }

  openQrGenerator() {
    this.showQrModal.set(true);
  }

  closeQrModal() {
    this.showQrModal.set(false);
  }
}
