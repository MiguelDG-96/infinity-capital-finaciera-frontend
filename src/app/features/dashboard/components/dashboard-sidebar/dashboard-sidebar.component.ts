import { Component, signal, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  isReady: boolean;
}

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrl: './dashboard-sidebar.component.css',
})
export class DashboardSidebarComponent implements OnInit {
  private authService = inject(AuthService);
  public themeService = inject(ThemeService);
  
  userData = this.authService.currentUserData;
  collapsed = signal(false);
  closeSidebar = output<void>();

  // Lista de módulos cargados desde el backend
  dynamicMenuItems = signal<MenuItem[]>([]);
  isLoading = signal(true);

  // Mapa de rutas del Backend -> Rutas de Angular
  private readonly ROUTE_MAP: Record<string, string> = {
    'home': '/dashboard',
    'billetera': '/dashboard/billetera',
    'creditos': '/dashboard/creditos/mis-creditos',
    'solicitar': '/dashboard/creditos/solicitar',
    'admin': '/dashboard/admin/solicitudes',
    'cartera': '/dashboard/admin/cartera',
    'tesoreria': '/dashboard/admin/tesoreria',
    'configuracion-tasas': '/dashboard/admin/tasas',
    'modulos': '/dashboard/admin/modulos',
    'seguridad': '/dashboard/admin/seguridad',
    'personal': '/dashboard/admin/personal',
    'admin/personal': '/dashboard/admin/personal',
    'reportes': '/dashboard/reportes',
    'estadisticas': '/dashboard/reportes',
  };

  ngOnInit() {
    this.cargarMenu();
  }

  cargarMenu() {
    this.isLoading.set(true);
    this.authService.getMisModulos().subscribe({
      next: (modulos) => {
        const items = modulos.map(m => {
          let route = this.ROUTE_MAP[m.ruta];
          
          // Coincidencia de respaldo por texto
          const lowerRuta = (m.ruta || '').toLowerCase();
          const lowerNombre = (m.nombre || '').toLowerCase();
          
          if (!route) {
            if (lowerRuta.includes('personal') || lowerNombre.includes('personal')) {
              route = '/dashboard/admin/personal';
            } else if (lowerRuta.includes('cartera') || lowerNombre.includes('cartera')) {
              route = '/dashboard/admin/cartera';
            }
          }
          
          return {
            label: m.nombre,
            icon: this.mapIcon(m.icono),
            route: route || '/dashboard',
            isReady: !!route
          };
        });
        

        
        this.dynamicMenuItems.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private mapIcon(backendIcon: string): string {
    if (!backendIcon) return 'layers';
    const icon = backendIcon.replace('fas fa-', '').replace('fa-', '');
    const iconMap: Record<string, string> = {
      'home': 'home',
      'credit-card': 'credit-card',
      'shield-halved': 'file-text',
      'gears': 'settings',
      'lock': 'shield',
      'box': 'layers',
      'chart-pie': 'pie-chart',
      'chart-bar': 'bar-chart',
      'chart-line': 'activity'
    };
    return iconMap[icon] || icon;
  }

  getInitials(): string {
    const name = this.userData()?.nombreCompleto || 'User';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
