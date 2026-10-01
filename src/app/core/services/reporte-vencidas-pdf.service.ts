import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { DatePipe } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ReporteVencidasPdfService {
  private datePipe = new DatePipe('es-PE');

  private fmtMoney(val: any): string {
    const n = parseFloat(val);
    if (isNaN(n)) return 'S/ 0.00';
    return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  async generarReporte(creditos: any[]): Promise<void> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210;
    const margin = 14;
    const pageH = 297;

    // ── Colores ──────────────────────────────────────────────────────────────
    const RED_HEADER: [number, number, number] = [185, 28, 28];
    const DARK:  [number, number, number] = [15,  23, 42];
    const GRAY:  [number, number, number] = [100, 116, 139];
    const LGRAY: [number, number, number] = [248, 250, 252]; // Para filas impares
    
    // Procesar datos
    let deudas: any[] = [];
    
    creditos.forEach(c => {
      let deudaVencida = 0;
      let diasAtrasoMax = 0;
      let tieneVencidas = false;

      if (c.cuotas && c.cuotas.length > 0) {
        c.cuotas.forEach((cuota: any) => {
          if (cuota.estadoCuota === 'MORA' || cuota.estadoCuota === 'PENDIENTE') {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const vencimiento = new Date(cuota.fechaVencimiento);
            vencimiento.setHours(0, 0, 0, 0);

            if (vencimiento < hoy) {
              tieneVencidas = true;
              deudaVencida += (cuota.totalCuota || 0) - (cuota.montoPagadoCliente || 0);
              
              const dias = Math.floor((hoy.getTime() - vencimiento.getTime()) / (1000 * 3600 * 24));
              if (dias > diasAtrasoMax) diasAtrasoMax = dias;
            }
          }
        });
      }
      
      // En caso de que el crédito ya tenga "diasAtraso" calculado en el backend, priorizar si es mayor
      if (c.diasAtraso && c.diasAtraso > diasAtrasoMax) {
          diasAtrasoMax = c.diasAtraso;
      }

      if (tieneVencidas && deudaVencida > 0) {
        const cliente = c.cliente || {};
        let extra = {} as any;
        if (cliente?.datosSolicitud) {
          try {
            extra = typeof cliente.datosSolicitud === 'string' ? JSON.parse(cliente.datosSolicitud) : cliente.datosSolicitud;
          } catch(e) {}
        }
        
        let nombreFormateado = cliente.nombre || c.nombreCliente || '';
        const isJuridica = cliente.tipoPersona === 'JURIDICA' || cliente.tipoDocumento === 'RUC';
        if (!isJuridica && (extra.apellidoPaterno || extra.nombres)) {
          nombreFormateado = `${extra.apellidoPaterno || ''} ${extra.apellidoMaterno || ''} ${extra.nombres || ''}`.replace(/\s+/g, ' ').trim();
        }

        deudas.push({
          idCredito: c.id,
          nombre: nombreFormateado.toUpperCase(),
          monto: deudaVencida,
          diasAtraso: diasAtrasoMax
        });
      }
    });

    // Ordenar de mayor a menor según días de atraso
    deudas.sort((a, b) => b.diasAtraso - a.diasAtraso);

    let y = 20;
    const fechaReporte = this.datePipe.transform(new Date(), 'dd/MM/yyyy') || '';

    const printHeaderInfo = (posY: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0);
      doc.text('REPORTE DE DEUDAS VENCIDAS', W / 2, posY, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Ordenado de mayor a menor según días de atraso · Fecha de reporte: ${fechaReporte}`, W / 2, posY + 6, { align: 'center' });
    };

    // Imprimir titulo solo en la primera página
    printHeaderInfo(y);
    y += 15;

    // Configuración de tabla (Total width 182)
    const cols = [
      { label: 'N°', x: margin, w: 10, align: 'center' as const },
      { label: 'ID CRÉDITO', x: margin + 10, w: 22, align: 'center' as const },
      { label: 'NOMBRE', x: margin + 32, w: 75, align: 'left' as const },
      { label: 'MONTO DE DEUDA', x: margin + 107, w: 40, align: 'right' as const },
      { label: 'DÍAS DE ATRASO', x: margin + 147, w: 35, align: 'center' as const }
    ];

    const drawTableHeader = (yH: number) => {
      doc.setFillColor(...RED_HEADER);
      doc.rect(margin, yH - 5, W - margin * 2, 8, 'F');
      
      // Dibujar lineas divisorias entre las celdas del header
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.2);
      cols.forEach((col, index) => {
          if (index < cols.length - 1) {
             const nextCol = cols[index+1];
             doc.line(nextCol.x, yH - 5, nextCol.x, yH + 3);
          }
      });
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      for (const col of cols) {
        if (col.align === 'center') {
            doc.text(col.label, col.x + col.w / 2, yH, { align: 'center' });
        } else if (col.align === 'left') {
            doc.text(col.label, col.x + 2, yH);
        } else {
            doc.text(col.label, col.x + col.w - 2, yH, { align: 'right' });
        }
      }
    };

    drawTableHeader(y);
    y += 7;

    doc.setFontSize(9);
    doc.setLineWidth(0.1);

    for (let i = 0; i < deudas.length; i++) {
      const d = deudas[i];

      // Salto de página
      if (y > pageH - 20) {
        doc.addPage();
        y = 20; // Empezar un poco más arriba ya que no hay titulo
        drawTableHeader(y);
        y += 7;
      }

      // Fondo alterno
      if (i % 2 !== 0) {
        doc.setFillColor(...LGRAY);
        doc.rect(margin, y - 4, W - margin * 2, 7, 'F');
      }

      // Bordes verticales y horizontales finos para la tabla (simulando Excel)
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + 3, W - margin, y + 3); // Liena inferior
      
      // Lineas verticales de separacion
      doc.line(margin, y - 4, margin, y + 3); // borde izq
      cols.forEach((col, index) => {
          if (index < cols.length - 1) {
             const nextCol = cols[index+1];
             doc.line(nextCol.x, y - 4, nextCol.x, y + 3);
          }
      });
      doc.line(W - margin, y - 4, W - margin, y + 3); // borde der

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);

      const cellText = (text: string, col: typeof cols[0], yPos: number) => {
        if (col.align === 'center') {
            doc.text(text, col.x + col.w / 2, yPos, { align: 'center' });
        } else if (col.align === 'left') {
            doc.text(doc.splitTextToSize(text, col.w - 4)[0], col.x + 2, yPos);
        } else {
            doc.text(text, col.x + col.w - 2, yPos, { align: 'right' });
        }
      };

      cellText(String(i + 1), cols[0], y);
      cellText(String(d.idCredito || '-'), cols[1], y);
      cellText(d.nombre, cols[2], y);
      cellText(this.fmtMoney(d.monto), cols[3], y);
      
      // Días de atraso en color rojo
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      cellText(String(d.diasAtraso), cols[4], y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);

      y += 7;
    }

    if (y > pageH - 15) {
      doc.addPage();
      y = 20;
    }
    
    y += 5;
    const totalDeudores = deudas.length;
    const montoTotalVencido = deudas.reduce((sum, d) => sum + d.monto, 0);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de deudores: ${totalDeudores} · Monto total vencido: ${this.fmtMoney(montoTotalVencido)}`, W - margin, y, { align: 'right' });

    doc.save(`Reporte_Deudas_Vencidas_${this.datePipe.transform(new Date(), 'yyyyMMdd')}.pdf`);
  }
}
