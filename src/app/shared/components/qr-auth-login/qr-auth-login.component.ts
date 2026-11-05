import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { QrService } from '../../../core/services/qr.service';

export type QrState = 'LOADING' | 'PENDING' | 'SCANNED' | 'APPROVED' | 'EXPIRED' | 'REJECTED' | 'ERROR';

export interface QrChallenge {
  token: string;
  targetSystem: string;
  expiresInSeconds: number;
  expiresAt: string;
  qrData: string;
}

export interface QrStatusResponse {
  token: string;
  status: string;
  deviceName?: string;
  message?: string;
  authPayload?: any;
  isExpired: boolean;
}

@Component({
  selector: 'app-qr-auth-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-auth-login.component.html',
  styleUrl: './qr-auth-login.component.css'
})
export class QrAuthLoginComponent implements OnInit, OnDestroy {
  @Input() targetSystem: string = 'infinity';
  @Output() loginSuccess = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  state: QrState = 'LOADING';
  currentChallenge: QrChallenge | null = null;
  qrDataUrl: string | null = null;
  secondsRemaining: number = 50;
  totalSeconds: number = 50;
  deviceName: string = '';
  statusMessage: string = '';

  private countdownTimer: any = null;
  private pollingTimer: any = null;
  private isDestroyed: boolean = false;

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private qrService: QrService,
    private cdr: ChangeDetectorRef
  ) {
    const rawUrl = (environment as any).argosApiUrl || 'https://maestro.arqui-design.com';
    this.baseUrl = rawUrl.replace(/\/+$/, '');
  }

  ngOnInit(): void {
    this.initiateQrSession();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.clearTimers();
  }

  get progressPercentage(): number {
    if (this.totalSeconds <= 0) return 0;
    return Math.max(0, Math.min(100, (this.secondsRemaining / this.totalSeconds) * 100));
  }

  initiateQrSession(): void {
    this.clearTimers();
    this.state = 'LOADING';
    this.statusMessage = 'Generando código QR seguro...';
    this.cdr.detectChanges();

    const url = `${this.baseUrl}/api/auth/qr/generate`;
    const payload = {
      targetSystem: this.targetSystem,
      ttlSeconds: 50
    };

    this.http.post<QrChallenge>(url, payload).subscribe({
      next: async (challenge) => {
        if (this.isDestroyed) return;

        this.currentChallenge = challenge;
        this.totalSeconds = challenge.expiresInSeconds || 50;
        this.secondsRemaining = this.totalSeconds;

        try {
          this.qrDataUrl = await this.qrService.generateQrWithLogo(challenge.qrData);
          this.state = 'PENDING';
          this.statusMessage = 'Abre tu app ARGOS Mobile y apunta con tu cámara.';
          this.startCountdown();
          this.startPolling(challenge.token);
        } catch (err) {
          console.error('Error al renderizar QR:', err);
          this.state = 'ERROR';
          this.statusMessage = 'Error al renderizar el código QR.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al generar sesión QR:', err);
        if (this.isDestroyed) return;
        this.state = 'ERROR';
        this.statusMessage = 'No fue posible conectar con el servicio de autenticación ARGOS.';
        this.cdr.detectChanges();
      }
    });
  }

  reloadQr(): void {
    this.initiateQrSession();
  }

  private startCountdown(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = setInterval(() => {
      if (this.secondsRemaining > 0) {
        this.secondsRemaining--;
        if (this.secondsRemaining <= 0) {
          this.handleExpiration();
        }
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  private startPolling(token: string): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);

    this.pollingTimer = setInterval(() => {
      if (this.isDestroyed || this.state === 'EXPIRED' || this.state === 'APPROVED') {
        return;
      }

      const url = `${this.baseUrl}/api/auth/qr/status/${token}`;
      this.http.get<QrStatusResponse>(url).subscribe({
        next: (res) => {
          if (this.isDestroyed) return;

          // 1. Prioridad: Si ya fue aprobado, autenticar de inmediato
          if (res.status === 'Approved') {
            this.state = 'APPROVED';
            this.statusMessage = '¡Inicio de sesión aprobado!';
            this.clearTimers();
            this.cdr.detectChanges();

            setTimeout(() => {
              this.loginSuccess.emit(res.authPayload);
            }, 400);
            return;
          }

          // 2. Si fue rechazado
          if (res.status === 'Rejected') {
            this.state = 'REJECTED';
            this.statusMessage = res.message || 'El inicio de sesión fue cancelado en tu teléfono.';
            this.clearTimers();
            this.cdr.detectChanges();
            return;
          }

          // 3. Expirado
          if (res.isExpired || res.status === 'Expired') {
            this.handleExpiration();
            return;
          }

          // 4. Escaneado
          if (res.status === 'Scanned' && this.state !== 'SCANNED') {
            this.state = 'SCANNED';
            this.deviceName = res.deviceName || 'Dispositivo Móvil';
            this.statusMessage = res.message || 'Código escaneado. Confirma con tu huella/Face ID.';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          if (err.status === 404) {
            this.handleExpiration();
          }
        }
      });
    }, 1500);
  }

  private handleExpiration(): void {
    this.clearTimers();
    this.state = 'EXPIRED';
    this.statusMessage = 'El código QR ha expirado.';
    this.cdr.detectChanges();
  }

  private clearTimers(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}

