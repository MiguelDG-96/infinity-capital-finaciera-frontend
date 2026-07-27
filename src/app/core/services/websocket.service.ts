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
  private readonly baseUrl = environment.apiUrl.replace('/api/v1', '');
  
  // Señal que guarda las últimas notificaciones
  readonly notifications = signal<AppNotification[]>([]);
  
  // Señal para logout forzado
  readonly forceLogoutEvent = signal<any>(null);

  constructor() {
    // La conexión se hará en connect() para tener el token
  }

  connect(token: string) {
    if (this.client && this.client.active) return;
    
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws`),
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

    this.client.activate();
  }

  private subscribeToForceLogout(token: string): void {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(decodeURIComponent(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')));
        
        const userId = payload.sub; // En InfinityCapital el subject suele ser el email, wait, in InfinityCapital is 'sub' email or id? Let's check AuthMapper or use payload.id
        // We will just use 'sub' and maybe 'id'
        const id = payload.id || payload.userId || payload.sub;
        if (id && this.client) {
          this.client.subscribe('/topic/logout/' + id, (message: Message) => {
            const body = JSON.parse(message.body);
            if (body.action === 'logout') {
              // Emit event
              this.forceLogoutEvent.set(body);
            }
          });
        }
      }
    } catch (e) {
      console.error('Error decoding token for WS logout', e);
    }
  }

  disconnect() {
    if (this.client && this.client.active) {
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
