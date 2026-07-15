import { Component, input, output, signal, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, Download, Share2, QrCode, Loader2 } from 'lucide-angular';
import { QrService } from '../../../core/services/qr.service';

@Component({
  selector: 'app-qr-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './qr-modal.component.html',
  styleUrl: './qr-modal.component.css'
})
export class QrModalComponent implements OnChanges {
  // Icons
  readonly X = X;
  readonly Download = Download;
  readonly Share2 = Share2;
  readonly QrCode = QrCode;
  readonly Loader2 = Loader2;

  // Inputs/Outputs
  isOpen = input<boolean>(false);
  qrText = input<string>('');
  title = input<string>('Generador QR Oficial');
  onClose = output<void>();

  // State
  qrDataUrl = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  constructor(private qrService: QrService) {}

  // Effect-like behavior when isOpen changes
  ngOnChanges(): void {
    if (this.isOpen() && this.qrText()) {
      this.generateQR();
    }
  }

  async generateQR() {
    this.isLoading.set(true);
    try {
      const dataUrl = await this.qrService.generateQrWithLogo(this.qrText());
      this.qrDataUrl.set(dataUrl);
    } catch (error) {
      console.error('Error generating QR:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  closeModal() {
    this.qrDataUrl.set(null);
    this.onClose.emit();
  }

  downloadQR() {
    const dataUrl = this.qrDataUrl();
    if (dataUrl) {
      this.qrService.downloadImage(dataUrl, `QR_Oficial_${new Date().getTime()}.png`);
    }
  }

  async shareQR() {
    const dataUrl = this.qrDataUrl();
    if (!dataUrl) return;

    try {
      if (navigator.share && navigator.canShare) {
        // Convert DataURL to File
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'QR_Corporativo.png', { type: 'image/png' });

        const shareData = {
          title: this.title(),
          text: 'Te comparto este código QR oficial de Infinity Capital Financiera.',
          files: [file]
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          this.fallbackShare();
        }
      } else {
        this.fallbackShare();
      }
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        console.error('Error sharing QR:', error);
      }
    }
  }

  private async fallbackShare() {
    try {
      await navigator.clipboard.writeText(this.qrText());
      alert('Enlace copiado al portapapeles. La función de compartir archivos no es compatible con este dispositivo/navegador.');
    } catch (err) {
      console.error('Fallback share failed:', err);
    }
  }
}
