import { Component, signal, ViewEncapsulation, OnInit, OnDestroy, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DashboardNavbarComponent } from '../../features/dashboard/components/dashboard-navbar/dashboard-navbar.component';
import { DashboardSidebarComponent } from '../../features/dashboard/components/dashboard-sidebar/dashboard-sidebar.component';
import { NotificationDrawerComponent } from '../../features/dashboard/components/notification-drawer/notification-drawer.component';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';

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
    NotificationDrawerComponent
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
          // En vez de un toast, hacemos que el NotificationService actual recargue sus contadores
          this.notificationService.recargar();
          this.websocketService.marcarComoLeida(last.id);
        }
      }
    });
  }

  ngOnInit() {
    const rol = this.authService.currentUserData()?.rol;
    if (rol === 'ROLE_ADMIN' || rol === 'ROLE_TRABAJADOR') {
      this.websocketService.connect();
    }
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
