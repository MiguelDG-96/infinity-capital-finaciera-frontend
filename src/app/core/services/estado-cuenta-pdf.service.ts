import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { DatePipe } from '@angular/common';
import { Credito, Cuota } from '../models/credito.model';

@Injectable({ providedIn: 'root' })
export class EstadoCuentaPdfService {
  private datePipe = new DatePipe('es-PE');

  private fmt(val: any): string {
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  }

  private fmtMoney(val: any, simbolo = 'S/'): string {
    const n = parseFloat(val);
    if (isNaN(n)) return '—';
    return `${simbolo} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private fmtDate(val: any): string {
    if (!val) return '—';
    try {
      const d = Array.isArray(val)
        ? new Date(val[0], val[1] - 1, val[2])
        : new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return this.datePipe.transform(d, 'dd/MM/yyyy') || '—';
    } catch {
      return String(val);
    }
  }

  private drawHLine(doc: jsPDF, y: number, x1 = 14, x2 = 196, r = 200, g = 200, b = 200) {
    doc.setDrawColor(r, g, b);
    doc.line(x1, y, x2, y);
  }

  private async getSvgDataUrl(): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200; canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, 200, 200); resolve(canvas.toDataURL('image/png')); }
        else resolve('');
      };
      img.onerror = () => resolve('');
      img.src = '/logo/logo-red.svg';
    });
  }

  /**
   * Genera el PDF de Estado de Cuenta y lo retorna como Blob.
   * @param credito  Objeto crédito completo (con cliente)
   * @param cuotas   Cronograma de cuotas
   */
  async generarEstadoCuenta(credito: Credito, cuotas: Cuota[]): Promise<Blob> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210;
    const margin = 14;
    const pageH = 297;

    // ── Colores ──────────────────────────────────────────────────────────────
    const RED:   [number, number, number] = [185, 28, 28];
    const DARK:  [number, number, number] = [15,  23, 42];
    const GRAY:  [number, number, number] = [100, 116, 139];
    const LGRAY: [number, number, number] = [241, 245, 249];
    const GREEN: [number, number, number] = [21, 128, 61];
    const AMBER: [number, number, number] = [180, 83, 9];
    const DRED:  [number, number, number] = [185, 28, 28];

    const cliente: any = credito.cliente || {};
    const usuario: any = cliente.usuario || {};
    const simbolo = credito.simboloMoneda || 'S/';
    const nombreCompleto = usuario.nombreCompleto || credito.nombreCliente || 'Cliente';
    const dni = cliente.numeroDocumento || credito.documento || '—';
    const email = usuario.email || '—';
    const direccion = cliente.domicilio || cliente.direccion || '—';

    const montoAprobado = credito.montoAprobado || credito.montoCredito || 0;
    const saldoActual   = credito.debeActualidad || 0;
    const cuotasPagadas = cuotas.filter(c => c.estadoCuota === 'PAGADO').length;
    const cuotasPendientes = cuotas.filter(c => c.estadoCuota !== 'PAGADO' && c.estadoCuota !== 'POSTERGADA').length;
    const proximaCuota = cuotas.find(c => c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'MORA');
    const fechaGeneracion = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm') || '';
    const periodoLabel = this.datePipe.transform(new Date(), 'MMMM yyyy') || '';

    // ── HEADER ───────────────────────────────────────────────────────────────
    // Franja roja superior
    doc.setFillColor(...RED);
    doc.rect(0, 0, W, 22, 'F');

    // Logo
    const logoUrl = await this.getSvgDataUrl();
    if (logoUrl) doc.addImage(logoUrl, 'PNG', margin, 3, 14, 14);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('InfinyCapital', margin + 17, 11);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('SERVICIOS FINANCIEROS', margin + 17, 16);

    // Título derecha
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO DE CUENTA', W - margin, 10, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${periodoLabel.toUpperCase()}`, W - margin, 16, { align: 'right' });

    let y = 30;

    // ── SECCIÓN: DATOS DEL TITULAR ───────────────────────────────────────────
    doc.setFillColor(...LGRAY);
    doc.rect(margin, y, W - margin * 2, 7, 'F');
    doc.setTextColor(...RED);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL TITULAR', margin + 3, y + 4.8);
    y += 10;

    // Dos columnas
    const col1 = margin;
    const col2 = 110;
    doc.setFontSize(8);

    const drawField = (label: string, value: string, x: number, yPos: number) => {
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'bold');
      doc.text(label, x, yPos);
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'normal');
      doc.text(value, x + 32, yPos);
    };

    drawField('Nombre:', nombreCompleto.toUpperCase(), col1, y);
    drawField('DNI:', dni, col2, y);
    y += 6;
    drawField('Dirección:', doc.splitTextToSize(direccion, 60)[0], col1, y);
    drawField('Email:', email, col2, y);
    y += 6;
    drawField('Teléfono:', this.fmt(cliente.celular || cliente.telefono), col1, y);
    drawField('Generado:', fechaGeneracion, col2, y);
    y += 6;
    this.drawHLine(doc, y);
    y += 5;

    // ── SECCIÓN: RESUMEN DEL CRÉDITO + ESTADO FINANCIERO ────────────────────
    const boxW = (W - margin * 2 - 6) / 2;

    // Caja izquierda: Detalle del crédito
    doc.setFillColor(...LGRAY);
    doc.rect(col1, y, boxW, 7, 'F');
    doc.setTextColor(...RED);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DEL CRÉDITO', col1 + 3, y + 4.8);

    // Caja derecha: Estado financiero
    doc.setFillColor(...LGRAY);
    doc.rect(col2 - 4, y, boxW, 7, 'F');
    doc.setTextColor(...RED);
    doc.text('ESTADO FINANCIERO', col2 - 1, y + 4.8);
    y += 10;

    doc.setFontSize(8);

    const drawPair = (label: string, value: string, x: number, yPos: number, valueColor?: [number,number,number]) => {
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'bold');
      doc.text(label, x, yPos);
      doc.setTextColor(...(valueColor || DARK));
      doc.setFont('helvetica', 'normal');
      doc.text(value, x + 36, yPos);
    };

    const rows: [string, string, string, string][] = [
      ['Tipo de Crédito:', credito.tipoCredito || '—', 'Monto Aprobado:', this.fmtMoney(montoAprobado, simbolo)],
      ['Moneda:', credito.moneda || '—', 'Saldo Actual:', this.fmtMoney(saldoActual, simbolo)],
      ['Tasa TEM:', `${credito.tasaAprobada || credito.tem || 0}%`, 'Cuota Mensual:', this.fmtMoney(credito.cuotaMensual, simbolo)],
      ['Plazo:', `${credito.plazoMeses || 0} meses`, 'Cuotas Pagadas:', `${cuotasPagadas} / ${cuotas.length}`],
      ['Desembolso:', this.fmtDate(credito.fechaDesembolso), 'Cuotas Pend.:', `${cuotasPendientes}`],
      ['Vencimiento:', this.fmtDate(credito.fechaVencimiento), 'Banco:', this.fmt(credito.bancoDesembolso)],
    ];

    for (const [l1, v1, l2, v2] of rows) {
      drawPair(l1, v1, col1, y);
      drawPair(l2, v2, col2 - 4, y);
      y += 6;
    }

    // Próxima cuota destacada
    if (proximaCuota) {
      y += 2;
      doc.setFillColor(255, 251, 235);
      doc.rect(margin, y - 3, W - margin * 2, 9, 'F');
      doc.setDrawColor(...AMBER);
      doc.rect(margin, y - 3, W - margin * 2, 9, 'S');
      doc.setTextColor(...AMBER);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `⚠  PRÓXIMA CUOTA: ${this.fmtMoney(proximaCuota.totalCuota, simbolo)}  —  Vence: ${this.fmtDate(proximaCuota.fechaVencimiento)}`,
        W / 2, y + 2.5, { align: 'center' }
      );
      y += 12;
    } else {
      y += 5;
    }

    this.drawHLine(doc, y);
    y += 5;

    // ── SECCIÓN: CRONOGRAMA DE PAGOS ─────────────────────────────────────────
    doc.setFillColor(...LGRAY);
    doc.rect(margin, y, W - margin * 2, 7, 'F');
    doc.setTextColor(...RED);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CRONOGRAMA DE PAGOS', margin + 3, y + 4.8);
    y += 10;

    // ── Columnas: total usable = 182mm (x: 14 → 196) ─────────────────────────
    const cols: { label: string; x: number; w: number; align: 'c' | 'r' }[] = [
      { label: 'N°',          x: 14,  w:  8,  align: 'c' },
      { label: 'Vencimiento', x: 22,  w: 26,  align: 'c' },
      { label: 'Capital',     x: 48,  w: 26,  align: 'c' },
      { label: 'Interés',     x: 74,  w: 26,  align: 'c' },
      { label: 'Mora',        x: 100, w: 20,  align: 'c' },
      { label: 'Total',       x: 120, w: 26,  align: 'c' },
      { label: 'Saldo',       x: 146, w: 26,  align: 'c' },
      { label: 'Estado',      x: 172, w: 24,  align: 'c' },
    ]; // 8+26+26+26+20+26+26+24 = 182 ✓

    const PAD = 1;

    const cellText = (text: string, col: typeof cols[0], yPos: number) => {
      doc.text(text, col.x + col.w / 2, yPos, { align: 'center' });
    };

    // Dibujar cabecera
    const drawTableHeader = (yH: number) => {
      doc.setFillColor(51, 65, 85);
      doc.rect(margin, yH - 3.5, W - margin * 2, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      for (const col of cols) {
        doc.text(col.label, col.x + col.w / 2, yH + 1, { align: 'center' });
      }
    };

    drawTableHeader(y);
    y += 6;

    const estadoColor = (estado: string): [number, number, number] => {
      switch (estado) {
        case 'PAGADO': return GREEN;
        case 'MORA': return DRED;
        case 'PAGADO_PARCIAL': return AMBER;
        case 'REVISION': return [37, 99, 235];
        default: return DARK;
      }
    };

    const estadoLabel = (estado: string): string => {
      switch (estado) {
        case 'PAGADO':       return 'PAGADO';
        case 'PENDIENTE':    return 'PENDIENTE';
        case 'MORA':         return 'MORA';
        case 'PAGADO_PARCIAL': return 'PARCIAL';
        case 'POSTERGADA':   return 'POSTERG.';
        case 'REVISION':     return 'REVISIÓN';
        default: return estado;
      }
    };

    // Saldo progresivo por fila
    let saldoProgresivo = montoAprobado;

    for (let i = 0; i < cuotas.length; i++) {
      const cuota = cuotas[i];

      // Salto de página
      if (y > pageH - 25) {
        doc.addPage();
        y = 20;
        drawTableHeader(y);
        y += 6;
      }

      // Fondo alterno
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 3, W - margin * 2, 6.5, 'F');
      }

      const rowH = y + 1;
      const mora = cuota.interesMora || 0;
      saldoProgresivo = Math.max(0, saldoProgresivo - (cuota.capital || 0));
      const color = estadoColor(cuota.estadoCuota);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);

      // N°
      cellText(String(cuota.numeroCuota), cols[0], rowH);
      // Vencimiento
      cellText(this.fmtDate(cuota.fechaVencimiento), cols[1], rowH);
      // Capital
      cellText(this.fmtMoney(cuota.capital, ''), cols[2], rowH);
      // Interés
      cellText(this.fmtMoney(cuota.interes, ''), cols[3], rowH);
      // Mora
      if (mora > 0) {
        doc.setTextColor(...DRED);
        cellText(this.fmtMoney(mora, ''), cols[4], rowH);
        doc.setTextColor(...DARK);
      } else {
        doc.text('—', cols[4].x + cols[4].w / 2, rowH, { align: 'center' });
      }
      // Total (bold)
      doc.setFont('helvetica', 'bold');
      cellText(this.fmtMoney(cuota.totalCuota, ''), cols[5], rowH);
      doc.setFont('helvetica', 'normal');
      // Saldo restante
      cellText(this.fmtMoney(saldoProgresivo, ''), cols[6], rowH);
      // Estado (color + badge)
      doc.setTextColor(...color);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      cellText(estadoLabel(cuota.estadoCuota), cols[7], rowH);
      // Reset
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...DARK);

      y += 6.5;
    }

    // Totales
    this.drawHLine(doc, y, margin, W - margin, 150, 150, 150);
    y += 4;
    const totalCapital = cuotas.reduce((s, c) => s + (c.capital || 0), 0);
    const totalInteres  = cuotas.reduce((s, c) => s + (c.interes || 0), 0);
    const totalMora     = cuotas.reduce((s, c) => s + (c.interesMora || 0), 0);
    const totalGeneral  = cuotas.reduce((s, c) => s + (c.totalCuota || 0), 0);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('TOTALES:', margin, y + 1);
    cellText(this.fmtMoney(totalCapital, ''), cols[2], y + 1);
    cellText(this.fmtMoney(totalInteres, ''), cols[3], y + 1);
    if (totalMora > 0) {
      doc.setTextColor(...DRED);
      cellText(this.fmtMoney(totalMora, ''), cols[4], y + 1);
    }
    doc.setTextColor(...RED);
    cellText(this.fmtMoney(totalGeneral, simbolo), cols[5], y + 1);
    y += 8;

    // ── FOOTER en todas las páginas ──────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(51, 65, 85);
      doc.rect(0, pageH - 12, W, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'InfinyCapital — Documento confidencial. Este estado de cuenta es generado automáticamente.',
        W / 2, pageH - 6, { align: 'center' }
      );
      doc.text(`Pág. ${p} / ${totalPages}`, W - margin, pageH - 6, { align: 'right' });
    }

    return doc.output('blob');
  }
}
