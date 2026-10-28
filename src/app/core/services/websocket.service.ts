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
  private client: Client | null = null;

  private readonly socketUrl = environment.apiUrl.replace('/api/v1', '') + '/ws';

  // Señal que guarda las últimas notificaciones
  readonly notifications = signal<AppNotification[]>([]);

  // Señal para logout forzado
  readonly forceLogoutEvent = signal<any>(null);

  constructor() {}

  connect(token: string) {
    if (this.client && this.client.active) return;

    console.log('🔌 Conectando WebSocket a:', this.socketUrl);

    this.client = new Client({
      webSocketFactory: () => new SockJS(this.socketUrl, null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling']
      }),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame: IFrame) => {
      console.log('✅ Conectado a WebSockets', frame);

      this.client?.subscribe('/topic/notificaciones', (message: Message) => {
        if (message.body) {
          const payload = JSON.parse(message.body);
          this.handleNotification(payload);
        }
      });

      this.subscribeToForceLogout(token);
    };

    this.client.onStompError = (frame: IFrame) => {
      console.error('❌ Broker reportó error: ' + frame.headers['message']);
      console.error('Detalles: ' + frame.body);
    };

    this.client.onWebSocketError = (evt: Event) => {
      console.error('❌ Error de WebSocket:', evt);
    };

    this.client.activate();
  }

  private subscribeToForceLogout(token: string): void {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(decodeURIComponent(
          atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
            .split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        ));
        const ids = new Set<string>();
        if (payload.id) ids.add(String(payload.id));
        if (payload.userId) ids.add(String(payload.userId));
        if (payload.sub) ids.add(String(payload.sub));

        ids.forEach(id => {
          this.client?.subscribe('/topic/logout/' + id, (message: Message) => {
            try {
              const body = JSON.parse(message.body);
              if (body.action === 'logout') {
                this.forceLogoutEvent.set(body);
              }
            } catch (err) {
              console.error('Error parseando logout:', err);
            }
          });
        });
      }
    } catch (e) {
      console.error('Error decoding token for WS logout', e);
    }
  }

  disconnect() {
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (e) {
        console.error('Error desactivando cliente WS', e);
      }
      this.client = null;
    }
  }

  private handleNotification(payload: any) {
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

    this.notifications.update(prev => [newNotif, ...prev].slice(0, 50));
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
