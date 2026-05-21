// src/app/features/dashboard/components/notification-drawer/notification-drawer.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-notification-drawer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './notification-drawer.component.html',
  styleUrls: ['./notification-drawer.component.css']
})
export class NotificationDrawerComponent implements OnInit {
  notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  get isAdmin(): boolean {
    const rol = this.authService.currentUserData()?.rol || '';
    return rol === 'ROLE_ADMIN' || rol === 'ROLE_TRABAJADOR';
  }

  ngOnInit() {
    if (this.isAdmin) {
      this.notificationService.iniciarPolling();
    }
  }

  close() {
    this.notificationService.close();
  }

  irAlCredito(creditoId: number) {
    this.notificationService.irAlCredito(creditoId);
  }

  recargar() {
    this.notificationService.recargar();
  }
}
