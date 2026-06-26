import { Injectable, signal } from '@angular/core';
import { Client, Message, IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  tipo: string;
  mensaje: string;
  monto?: number;
  moneda?: string;
  ip?: string;
  fecha: Date;
  leida: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private client: Client;
  private readonly baseUrl = environment.apiUrl.replace('/api/v1', '');
  
  // Señal que guarda las últimas notificaciones
  readonly notifications = signal<AppNotification[]>([]);

  constructor() {
    this.client = new Client({
      // Como no tenemos proxy para ws:// usamos sockjs que va sobre http
      webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame: IFrame) => {
      console.log('✅ Conectado a WebSockets', frame);
      
      // Suscribirse al tópico de notificaciones para los administradores
      this.client.subscribe('/topic/notificaciones', (message: Message) => {
        if (message.body) {
          const payload = JSON.parse(message.body);
          this.handleNotification(payload);
        }
      });
    };

    this.client.onStompError = (frame: IFrame) => {
      console.error('❌ Broker reportó error: ' + frame.headers['message']);
      console.error('Detalles: ' + frame.body);
    };
  }

  connect() {
    if (!this.client.active) {
      this.client.activate();
    }
  }

  disconnect() {
    if (this.client.active) {
      this.client.deactivate();
    }
  }

  private handleNotification(payload: any) {
    // Agregar sonido o toast visual si lo deseas
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      tipo: payload.tipo,
      mensaje: payload.mensaje,
      monto: payload.monto,
      moneda: payload.moneda,
      ip: payload.ip,
      fecha: new Date(),
      leida: false
    };

    this.notifications.update(prev => [newNotif, ...prev].slice(0, 50)); // Guardar últimas 50
    
    // Aquí puedes disparar una alerta nativa del navegador o un toast
    // Para simplificar, lo logueamos
    console.log('🔔 NOTIFICACIÓN RECIBIDA:', newNotif);
  }

  marcarComoLeida(id: string) {
    this.notifications.update(prev => 
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
  }

  limpiarNotificaciones() {
    this.notifications.set([]);
  }
}
