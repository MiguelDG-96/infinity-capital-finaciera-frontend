import { Component, signal, ViewEncapsulation, OnInit, OnDestroy, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DashboardNavbarComponent } from '../../features/dashboard/components/dashboard-navbar/dashboard-navbar.component';
import { DashboardSidebarComponent } from '../../features/dashboard/components/dashboard-sidebar/dashboard-sidebar.component';
import { NotificationDrawerComponent } from '../../features/dashboard/components/notification-drawer/notification-drawer.component';
import { CobranzaProgressWidgetComponent } from '../../features/dashboard/components/cobranza-progress-widget/cobranza-progress-widget.component';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { CobranzaAutoService } from '../../core/services/cobranza-auto.service';

import { AuthService } from '../../core/services/auth.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    RouterOutlet, 
    CommonModule, 
    DashboardNavbarComponent, 
    DashboardSidebarComponent,
    NotificationDrawerComponent,
    CobranzaProgressWidgetComponent
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css',
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = signal(false);
  
  showLogoutModal = signal(false);
  isLoggingOut = signal(false);

  constructor(
    public themeService: ThemeService,
    public notificationService: NotificationService,
    public cobranzaAutoService: CobranzaAutoService,
    private authService: AuthService,
    private websocketService: WebsocketService,
    private router: Router
  ) {
    // Escuchar notificaciones del WS y mandarlas al NotificationService
    effect(() => {
      const notifs = this.websocketService.notifications();
      if (notifs.length > 0) {
        const last = notifs[0];
        if (!last.leida) {
          this.notificationService.recargar();
          this.websocketService.marcarComoLeida(last.id);
        }
      }
    });

    // Escuchar logout forzado
    effect(() => {
      const logoutEvent = this.websocketService.forceLogoutEvent();
      if (logoutEvent) {
        alert(logoutEvent.mensaje || 'Tu sesión ha sido cerrada remotamente.');
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnInit() {
    const authData = this.authService.currentUser();
    const rol = this.authService.currentUserData()?.rol;
    if (rol === 'ROLE_ADMIN' || rol === 'ROLE_TRABAJADOR') {
      if (authData?.accessToken) {
        this.websocketService.connect(authData.accessToken);
      }
      this.notificationService.iniciarPolling();
      // Mostrar alerta de cobranza pendiente — esperar a que el polling tenga datos (máx 10s)
      this.esperarYMostrarCobranza();
    }
  }

  private esperarYMostrarCobranza(intentos = 0) {
    if (intentos > 10) return; // máx 10s de espera
    setTimeout(() => {
      const pendientes = this.notificationService.pendientesCobranza();
      if (pendientes.length > 0) {
        this.cobranzaAutoService.mostrarConfirmacion();
      } else if (intentos < 10) {
        this.esperarYMostrarCobranza(intentos + 1);
      }
    }, 1000);
  }

  ngOnDestroy() {
    this.websocketService.disconnect();
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
    console.log('Current User Data:', this.authService.currentUserData());
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  requestLogout() {
    this.showLogoutModal.set(true);
  }

  cancelLogout() {
    this.showLogoutModal.set(false);
  }

  confirmLogout() {
    this.showLogoutModal.set(false);
    this.isLoggingOut.set(true);
    
    // Simular blur de 2 segundos de cierre real
    setTimeout(() => {
      this.authService.logout();
      this.isLoggingOut.set(false);
      this.router.navigate(['/login']);
    }, 2000);
  }
}
