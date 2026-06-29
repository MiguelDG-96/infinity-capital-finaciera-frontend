import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { DatePipe } from '@angular/common';
import { Credito } from '../models/credito.model';

@Injectable({ providedIn: 'root' })
export class CartaNoAdeudoPdfService {
  private datePipe = new DatePipe('es-PE');

  private async getSvgDataUrl(): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 159; canvas.height = img.height || 72;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/png')); }
        else resolve('');
      };
      img.onerror = () => resolve('');
      img.src = '/logo/logo-red.svg';
    });
  }

  private async getFirmaDataUrl(): Promise<{url: string, ratio: number} | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 200; canvas.height = img.height || 100;
        const ctx = canvas.getContext('2d');
        if (ctx) { 
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
          resolve({ url: canvas.toDataURL('image/png'), ratio: canvas.width / canvas.height }); 
        }
        else resolve(null);
      };
      // Por defecto carga esta ruta, el usuario debe colocar su firma escaneada aquí
      img.onerror = () => resolve(null);
      img.src = '/pdf/firma_plantilla.png';
    });
  }

  private async getSelloDataUrl(): Promise<{url: string, ratio: number} | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 200; canvas.height = img.height || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) { 
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
          resolve({ url: canvas.toDataURL('image/png'), ratio: canvas.width / canvas.height }); 
        }
        else resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = '/sello/sello.png';
    });
  }

  private async getFirmaGerenteDataUrl(): Promise<{url: string, ratio: number} | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 200; canvas.height = img.height || 100;
        const ctx = canvas.getContext('2d');
        if (ctx) { 
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
          resolve({ url: canvas.toDataURL('image/png'), ratio: canvas.width / canvas.height }); 
        }
        else resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = '/sello/firma-gerente.png';
    });
  }

  private async getSelloFirmadoDataUrl(): Promise<{url: string, ratio: number} | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 200; canvas.height = img.height || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) { 
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
          resolve({ url: canvas.toDataURL('image/png'), ratio: canvas.width / canvas.height }); 
        }
        else resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = '/sello/sello-firmado.png';
    });
  }

  async generarCarta(credito: Credito): Promise<Blob> {
    const cliente: any = credito.cliente || {};
    const usuario: any = cliente.usuario || {};
    
    let extra: any = {};
    if (cliente.datosSolicitud) {
        try { extra = JSON.parse(cliente.datosSolicitud); } catch (e) {}
    }

    const dni = cliente.numeroDocumento || credito.documento || extra.numeroDocumento || '12345678';
    const nombreCompleto = usuario.nombreCompleto || credito.nombreCliente || extra.nombres || 'Cliente';
    const direccion = cliente.domicilio || cliente.direccion || extra.direccion || extra.domicilio || '—';
    const provincia = cliente.provincia || extra.provincia || '—';
    const departamento = cliente.departamento || extra.departamento || '—';
    const distrito = cliente.distrito || extra.distrito || '—';

    const sexoStr = String(cliente.sexo || extra.sexo || '').toLowerCase().trim();
    const estadoCivilStr = String(cliente.estadoCivil || extra.estadoCivil || '').toLowerCase().trim();

    let tratamiento = 'el/la señor(a) ';
    if (sexoStr === 'f' || sexoStr === 'femenino' || sexoStr === 'mujer') {
       if (estadoCivilStr.includes('solter')) {
           tratamiento = 'la señorita ';
       } else {
           tratamiento = 'la señora ';
       }
    } else if (sexoStr === 'm' || sexoStr === 'masculino' || sexoStr === 'hombre') {
       tratamiento = 'el señor ';
    }

    // @ts-ignore
    const doc = new jsPDF({ 
      unit: 'mm', 
      format: 'a4',
      encryption: {
        userPassword: dni,
        ownerPassword: dni,
        userPermissions: ['print']
      }
    });

    const W = 210;
    const margin = 14;
    const contentMargin = 35; // Margen A4 estándar para el contenido (2.5 cm)

    const HEADER_BG: [number, number, number] = [185, 28, 28]; // Mismo rojo del Estado de Cuenta original
    const DARK:  [number, number, number] = [15,  23, 42];

    // ── HEADER ───────────────────────────────────────────────────────────────
    doc.setFillColor(...HEADER_BG);
    doc.rect(0, 0, W, 22, 'F');

    const logoUrl = await this.getSvgDataUrl();
    if (logoUrl) doc.addImage(logoUrl, 'PNG', margin, 6, 22, 10);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFINYCAPITAL', margin + 26, 11);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('SERVICIOS FINANCIEROS', margin + 26, 15);

    let y = 40;

    // ── CUERPO ───────────────────────────────────────────────────────────────
    doc.setTextColor(...DARK);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Año centrado
    const nombreAnio = '“Año de la esperanza y el Fortalecimiento de la Democracia”';
    doc.text(nombreAnio, W / 2, y, { align: 'center' });
    y += 15;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.text('CARTA DE NO ADEUDO', W / 2, y, { align: 'center' });
    doc.line(W / 2 - 25, y + 1, W / 2 + 25, y + 1); // Subrayado simple
    y += 20;

    // Contenido
    doc.setFont('helvetica', 'normal');
    const txtParte1 = 'El que suscribe Analista de créditos de ';
    const txtParte2 = 'INFINYCAPITAL.';
    doc.text(txtParte1, contentMargin, y);
    const txtParte1W = doc.getTextWidth(txtParte1);
    doc.setFont('helvetica', 'bold');
    doc.text(txtParte2, contentMargin + txtParte1W, y);
    doc.setFont('helvetica', 'normal');
    y += 15;

    doc.text('HACE CONSTAR:', contentMargin, y);
    y += 10;

    // Texto legal
    const printMixedText = (docObj: any, parts: {t: string, b: boolean}[], x: number, startY: number, maxWidth: number) => {
      let cx = x;
      let cy = startY;
      for (const p of parts) {
        docObj.setFont('helvetica', p.b ? 'bold' : 'normal');
        const words = p.t.split(/(\s+)/);
        for (const word of words) {
          if (!word) continue;
          const wWidth = docObj.getTextWidth(word);
          if (!word.match(/^\s+$/) && cx + wWidth > x + maxWidth) {
             cx = x;
             cy += 6;
          }
          if (word.match(/^\s+$/) && cx === x) continue;
          docObj.text(word, cx, cy);
          cx += wWidth;
        }
      }
      return cy;
    };

    const cuerpoParts = [
      { t: `Que ${tratamiento}`, b: false },
      { t: nombreCompleto, b: true },
      { t: ', identificado con DNI N.º ', b: false },
      { t: dni, b: true },
      { t: ' domiciliado en ', b: false },
      { t: direccion, b: true },
      { t: ', distrito de ', b: false },
      { t: distrito, b: true },
      { t: ', provincia de ', b: false },
      { t: provincia, b: true },
      { t: ', departamento de ', b: false },
      { t: departamento, b: true },
      { t: ', ', b: false },
      { t: 'no presenta ninguna deuda pendiente', b: true },
      { t: ' con nuestra representada, toda vez que ', b: false },
      { t: 'ha cumplido con la cancelación total del producto crediticio', b: true },
      { t: ' que le fue otorgado a su favor.', b: false }
    ];

    y = printMixedText(doc, cuerpoParts, contentMargin, y, W - contentMargin * 2);
    y += 10;

    const cierreParts = [
      { t: 'En tal sentido, la mencionada persona ', b: false },
      { t: 'no mantiene obligación crediticia alguna con INFINYCAPITAL FINANCIERA', b: true },
      { t: ', en su calidad de titular.', b: false }
    ];

    y = printMixedText(doc, cierreParts, contentMargin, y, W - contentMargin * 2);

    y += 15;

    // Fecha dinámica
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const hoy = new Date();
    const fechaLetras = `Moyobamba, ${String(hoy.getDate()).padStart(2, '0')} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}.`;
    doc.text(fechaLetras, contentMargin, y);

    // Ajusta este valor para subir o bajar toda la sección de la firma (antes era 35)
    y += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    // ── SELLO Y FIRMA GERENCIA CENTRADO ─────────────────────────────────────
    const selloFirmadoInfo = await this.getSelloFirmadoDataUrl();
    if (selloFirmadoInfo) {
      const targetWidth = 55;
      const targetHeight = targetWidth / selloFirmadoInfo.ratio;
      const centerX = (W - targetWidth) / 2;
      
      // Ajustamos un poco la posición Y para que se vea bien
      doc.addImage(selloFirmadoInfo.url, 'PNG', centerX, y - targetHeight + 35, targetWidth, targetHeight);
    }

    y += 25;

    // Guardar el PDF
    return doc.output('blob');
  }
}
