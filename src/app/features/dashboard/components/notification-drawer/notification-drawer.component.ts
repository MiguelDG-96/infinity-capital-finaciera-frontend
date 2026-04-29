import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-notification-drawer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './notification-drawer.component.html',
  styleUrls: ['./notification-drawer.component.css']
})
export class NotificationDrawerComponent {
  notificationService = inject(NotificationService);

  notifications = [
    {
      id: 1,
      title: 'Nuevo préstamo aprobado',
      description: 'El préstamo para Juan Pérez ha sido aprobado exitosamente.',
      time: 'Hace 5 min',
      icon: 'check-circle2',
      type: 'success'
    },
    {
      id: 2,
      title: 'Recordatorio de pago',
      description: 'La cuota del cliente María García vence en 2 días.',
      time: 'Hace 2 horas',
      icon: 'calendar-clock',
      type: 'warning'
    },
    {
      id: 3,
      title: 'Mensaje de sistema',
      description: 'Mantenimiento programado para el domingo a las 2:00 AM.',
      time: 'Hace 5 horas',
      icon: 'alert-circle',
      type: 'info'
    }
  ];

  close() {
    this.notificationService.close();
  }
}
