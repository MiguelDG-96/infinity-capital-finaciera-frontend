// src/app/features/dashboard/components/notification-drawer/notification-drawer.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification-drawer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './notification-drawer.component.html',
  styleUrls: ['./notification-drawer.component.css']
})
export class NotificationDrawerComponent implements OnInit, OnDestroy {
  notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);

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

  ngOnDestroy() {
    this.notificationService.detenerPolling();
  }

  irAlCredito(creditoId: number) {
    this.notificationService.irAlCredito(creditoId);
  }

  irATesoreria() {
    this.notificationService.close();
    this.router.navigate(['/dashboard/admin/tesoreria']);
  }

  irACobranza() {
    this.notificationService.close();
    this.router.navigate(['/dashboard/admin/cobranza']);
  }

  irASolicitudes() {
    this.notificationService.close();
    this.router.navigate(['/dashboard/admin/solicitudes']);
  }

  recargar() {
    this.notificationService.recargar();
  }
}
