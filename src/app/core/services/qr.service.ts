import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

@Injectable({
  providedIn: 'root'
})
export class QrService {
  private readonly BRAND_COLOR = '#dc2626'; // Tailwind red-600
  private readonly CANVAS_SIZE = 1000;
  private readonly QR_SIZE = 800;
  private readonly LOGO_SIZE = 190;
  private readonly LOGO_PATH = 'logo/logo-red.png';

  /**
   * Generates a high-quality QR code with a centered logo.
   * @param text The text or URL to encode in the QR.
   * @returns A promise that resolves to the DataURL of the final PNG image.
   */
  async generateQrWithLogo(text: string): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = this.CANVAS_SIZE;
    canvas.height = this.CANVAS_SIZE;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // 1. Background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

    // 2. Generate QR
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: this.QR_SIZE,
      margin: 0,
      color: {
        dark: this.BRAND_COLOR,
        light: '#00000000' // transparent
      },
      errorCorrectionLevel: 'H'
    });

    const qrImg = await this.loadImage(qrDataUrl);
    const offset = (this.CANVAS_SIZE - this.QR_SIZE) / 2;
    ctx.drawImage(qrImg, offset, offset, this.QR_SIZE, this.QR_SIZE);

    // 3. Draw Rounded Box for Logo
    const centerX = this.CANVAS_SIZE / 2;
    const centerY = this.CANVAS_SIZE / 2;
    const boxSize = 250;
    const radius = 25;
    const x = centerX - (boxSize / 2);
    const y = centerY - (boxSize / 2);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + boxSize - radius, y);
    ctx.quadraticCurveTo(x + boxSize, y, x + boxSize, y + radius);
    ctx.lineTo(x + boxSize, y + boxSize - radius);
    ctx.quadraticCurveTo(x + boxSize, y + boxSize, x + boxSize - radius, y + boxSize);
    ctx.lineTo(x + radius, y + boxSize);
    ctx.quadraticCurveTo(x, y + boxSize, x, y + boxSize - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fillStyle = 'white';
    ctx.fill();

    // 4. Draw Logo
    try {
      const logoImg = await this.loadImage(this.LOGO_PATH);
      ctx.drawImage(logoImg, centerX - (this.LOGO_SIZE / 2), centerY - (this.LOGO_SIZE / 2), this.LOGO_SIZE, this.LOGO_SIZE);
    } catch (error) {
      console.warn('Could not load logo for QR, generating without logo.', error);
    }

    return canvas.toDataURL('image/png');
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  downloadImage(dataUrl: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
