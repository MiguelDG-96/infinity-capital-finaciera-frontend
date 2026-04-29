import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from '../../../../core/services/theme.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard-navbar.component.html',
  styleUrl: './dashboard-navbar.component.css',
})
export class DashboardNavbarComponent {
  constructor(
    public themeService: ThemeService,
    private notificationService: NotificationService,
    public authService: AuthService
  ) {}

  get userFullName(): string {
    return this.authService.currentUserData()?.nombreCompleto || 'Usuario';
  }

  get userPhotoUrl(): string | null {
    return this.authService.currentUserData()?.fotoUrl || null;
  }

  get userInitials(): string {
    const name = this.userFullName.trim();
    if (!name || name === 'Usuario') return 'US';
    
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  toggleSidebar = output<void>();
  logoutRequested = output<void>();

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  onToggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  onToggleNotifications() {
    this.notificationService.toggle();
  }
}
