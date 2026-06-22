import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { DatePipe } from '@angular/common';
import { Credito, Cuota } from '../models/credito.model';

@Injectable({ providedIn: 'root' })
export class CartaCobranzaPdfService {
  private datePipe = new DatePipe('es-PE');

  private async getSvgDataUrl(src: string): Promise<string> {
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
      img.src = src;
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

  async generarCarta(credito: Credito, cuotas: Cuota[], nivel: number, esParaGarante: boolean = false): Promise<Blob> {
    const cliente: any = credito.cliente || {};
    const usuario: any = cliente.usuario || {};
    
    let extra: any = {};
    if (cliente.datosSolicitud) {
        try { extra = JSON.parse(cliente.datosSolicitud); } catch (e) {}
    }

    const dni = cliente.numeroDocumento || credito.documento || extra.numeroDocumento || '12345678';
    const nombreTitular = usuario.nombreCompleto || credito.nombreCliente || extra.nombres || 'Cliente';
    let direccionTitular = cliente.domicilio || cliente.direccion || extra.direccion || extra.domicilio || '—';
    const distritoTitular = cliente.distrito || extra.distrito || '—';
    const manzanaTitular = cliente.manzana || extra.manzana || '';
    const loteTitular = cliente.lote || extra.lote || '';

    if (manzanaTitular && direccionTitular !== '—') {
      direccionTitular += ` MZ. ${manzanaTitular}`;
    }
    if (loteTitular && direccionTitular !== '—') {
      direccionTitular += ` LT. ${loteTitular}`;
    }

    let destinatarioNombre = nombreTitular;
    let destinatarioDni = dni;
    let destinatarioDireccion = direccionTitular;
    let destinatarioDistrito = distritoTitular;

    if (esParaGarante && credito.garantes && credito.garantes.length > 0) {
      const garante = credito.garantes[0]; // Usamos el primer garante para la carta
      destinatarioNombre = garante.nombreCompleto || 'Garante';
      destinatarioDni = garante.numeroDocumento || '—';
      destinatarioDireccion = garante.direccion || '—';
      destinatarioDistrito = '—'; // El DTO actual no tiene distrito detallado del garante
    }

    const cuotasVencidas = cuotas.filter(c => c.estadoCuota === 'MORA' || (c.estadoCuota === 'PENDIENTE' && new Date(c.fechaVencimiento) < new Date()));
    
    // Calcular días de atraso
    let diasAtraso = 0;
    if (cuotasVencidas.length > 0) {
      const primeraVencida = new Date(cuotasVencidas[0].fechaVencimiento);
      const hoy = new Date();
      const dif = hoy.getTime() - primeraVencida.getTime();
      diasAtraso = Math.max(0, Math.floor(dif / (1000 * 3600 * 24)));
    }

    const moneda = credito.simboloMoneda || 'S/';
    
    // Importe total adeudado a la fecha
    const totalAdeudado = cuotasVencidas.reduce((sum, c) => sum + (c.totalCuota || 0), 0);

    // @ts-ignore
    const doc = new jsPDF({ 
      unit: 'mm', 
      format: 'a4'
    });

    const W = 210;
    const margin = 14;
    const contentMargin = 25; // Margen para el contenido

    const HEADER_BG: [number, number, number] = [185, 28, 28]; // Mismo rojo del Estado de Cuenta original
    const DARK:  [number, number, number] = [15,  23, 42];

    // ── HEADER ───────────────────────────────────────────────────────────────
    doc.setFillColor(...HEADER_BG);
    doc.rect(0, 0, W, 22, 'F');

    const logoUrl = await this.getSvgDataUrl('/logo/logo-white.svg') || await this.getSvgDataUrl('/logo/logo-red.svg'); // Intentar logo blanco, sino rojo
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
    
    // Fecha dinámica
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const hoy = new Date();
    const fechaLetras = `Moyobamba, ${String(hoy.getDate()).padStart(2, '0')} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;
    doc.setFont('helvetica', 'normal');
    doc.text(fechaLetras, W - contentMargin, y, { align: 'right' });
    y += 15;

    // Datos Destinatario
    doc.setFont('helvetica', 'bold');
    doc.text('Señor(a):', contentMargin, y);
    y += 6;
    doc.text(destinatarioNombre.toUpperCase(), contentMargin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`DNI: ${destinatarioDni}`, contentMargin, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Dirección:', contentMargin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    
    let dirCompleta = destinatarioDireccion;
    if (destinatarioDistrito !== '—') {
      dirCompleta += `, ${destinatarioDistrito}`;
    }
    doc.text(dirCompleta, contentMargin, y);
    
    y += 15;

    // Título / Asunto
    doc.setFont('helvetica', 'bold');
    let asunto = 'NOTIFICACIÓN DE COBRANZA - RECORDATORIO DE PAGO';
    if (nivel === 2) asunto = 'REQUERIMIENTO FORMAL DE PAGO';
    if (nivel === 3) asunto = 'ÚLTIMO AVISO PRE-LEGAL';
    
    doc.text(`ASUNTO: ${asunto}`, contentMargin, y);
    doc.line(contentMargin, y + 1, contentMargin + doc.getTextWidth(`ASUNTO: ${asunto}`), y + 1);
    y += 15;

    // Contenido
    const printParagraph = (text: string, yPos: number): number => {
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(text, W - contentMargin * 2);
      doc.text(lines, contentMargin, yPos);
      return yPos + (lines.length * 6) + 4;
    };

    let texto = '';

    if (nivel === 1) {
      texto = `Estimado(a) cliente,\n\nPor medio de la presente nos dirigimos a usted para saludarle cordialmente e informarle que, tras la revisión de su estado de cuenta, hemos detectado que presenta un atraso en el pago de su crédito.`;
      if (esParaGarante) {
        texto = `Estimado(a) señor(a),\n\nNos dirigimos a usted en su calidad de GARANTE SOLIDARIO del crédito otorgado al(la) señor(a) ${nombreTitular}. Le informamos que a la fecha, dicho crédito presenta atraso en sus pagos.`;
      }
    } else if (nivel === 2) {
      texto = `De nuestra mayor consideración:\n\nNos dirigimos a usted para requerirle de manera formal la regularización de su crédito mantenido con INFINYCAPITAL, el cual a la fecha presenta cuotas impagas y días de mora acumulados.`;
      if (esParaGarante) {
        texto = `De nuestra mayor consideración:\n\nNos dirigimos a usted en su calidad de GARANTE SOLIDARIO del crédito de ${nombreTitular}, para requerirle formalmente la regularización de la deuda que a la fecha presenta mora.`;
      }
    } else {
      texto = `ÚLTIMO AVISO ANTES DE ACCIONES LEGALES\n\nNos dirigimos a usted para comunicarle que, debido al incumplimiento prolongado en sus obligaciones de pago con INFINYCAPITAL, su expediente está próximo a ser transferido a nuestra área legal para el inicio de las acciones de cobranza judicial y el respectivo reporte negativo a las Centrales de Riesgo.`;
      if (esParaGarante) {
        texto = `ÚLTIMO AVISO ANTES DE ACCIONES LEGALES AL GARANTE\n\nDebido al incumplimiento prolongado del crédito de ${nombreTitular}, en el cual usted figura como GARANTE SOLIDARIO, le notificamos que de no regularizarse la deuda, su expediente será transferido a nuestra área legal, asumiendo usted las mismas consecuencias jurídicas y reportes negativos en Centrales de Riesgo.`;
      }
    }

    y = printParagraph(texto, y);
    y += 5;

    // Detalle de la Deuda
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de la Deuda Actual:', contentMargin, y);
    y += 6;

    const tableX = contentMargin;
    const tableWidth = W - (contentMargin * 2); // Ancho completo disponible
    const colWidth = tableWidth / 3;
    const rowHeight = 10;
    
    const HEADER_BG_TABLE: [number, number, number] = [185, 28, 28]; // Rojo
    
    doc.setDrawColor(HEADER_BG_TABLE[0], HEADER_BG_TABLE[1], HEADER_BG_TABLE[2]);
    doc.setLineWidth(0.3);

    // --- Fila 1: Cabeceras (Fondo Rojo, Texto Blanco) ---
    doc.setFillColor(...HEADER_BG_TABLE);
    // Dibujar 3 rectángulos para las cabeceras
    for(let i=0; i<3; i++) {
        doc.rect(tableX + (i * colWidth), y, colWidth, rowHeight, 'FD'); // Fill and stroke
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    const centerText = (text: string, xBase: number, w: number, yPos: number) => {
        const textWidth = doc.getTextWidth(text);
        doc.text(text, xBase + (w / 2) - (textWidth / 2), yPos);
    };

    centerText('DÍAS DE ATRASO', tableX, colWidth, y + 6.5);
    centerText('CUOTAS VENCIDAS', tableX + colWidth, colWidth, y + 6.5);
    centerText('IMPORTE ADEUDADO', tableX + (colWidth * 2), colWidth, y + 6.5);
    
    y += rowHeight;

    // --- Fila 2: Valores (Fondo Blanco, Texto Negro/Rojo) ---
    doc.setTextColor(0, 0, 0); // Texto negro para valores
    // Dibujar 3 rectángulos para los valores
    for(let i=0; i<3; i++) {
        doc.rect(tableX + (i * colWidth), y, colWidth, rowHeight, 'S'); // Only stroke
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    centerText(`${diasAtraso} días`, tableX, colWidth, y + 6.5);
    centerText(`${cuotasVencidas.length} cuotas`, tableX + colWidth, colWidth, y + 6.5);
    
    doc.setFont('helvetica', 'bold');
    // doc.setTextColor(...HEADER_BG_TABLE); // Opcional: poner el monto en rojo
    centerText(`${moneda} ${totalAdeudado.toLocaleString('es-PE', {minimumFractionDigits: 2})}`, tableX + (colWidth * 2), colWidth, y + 6.5);

    // Restaurar color de texto a oscuro para el resto del documento
    doc.setTextColor(15, 23, 42); 
    
    y += rowHeight + 10;

    // Cierre
    let cierre = '';
    if (nivel === 1) {
      cierre = `Lo invitamos a acercarse a nuestras oficinas o utilizar nuestros canales de pago a la brevedad para regularizar esta situación y evitar el incremento de moras. Si usted ya realizó el pago, por favor haga caso omiso a esta comunicación.`;
    } else if (nivel === 2) {
      cierre = `Le otorgamos un plazo máximo de 48 horas desde la recepción de la presente para que proceda con la cancelación del monto vencido, evitando así el reporte negativo en las Centrales de Riesgo y gestiones adicionales de cobranza.`;
    } else {
      cierre = `Le otorgamos un plazo improrrogable de 24 horas para cancelar la totalidad de la deuda vencida. En caso de omisión, procederemos sin más aviso con las medidas judiciales correspondientes contra sus bienes, cuentas y los de su garante.`;
    }

    y = printParagraph(cierre, y);
    y += 10;
    
    doc.text('Atentamente,', contentMargin, y);
    
    y += 40; // Espacio para firma

    // ── FIRMAS Y SELLOS (CENTRADOS) ──────────────────────────────────────────
    const xCenter = W / 2;
    
    // Sello y Firma
    const selloFirmadoInfo = await this.getSelloFirmadoDataUrl();
    if (selloFirmadoInfo) {
      const targetWidth = 60;
      const targetHeight = targetWidth / selloFirmadoInfo.ratio;
      doc.addImage(selloFirmadoInfo.url, 'PNG', xCenter - targetWidth / 2, y - targetHeight, targetWidth, targetHeight);
    }

    y += 15;

    // Logo debajo de la firma
    const logoRojoUrl = await this.getSvgDataUrl('/logo/logo-red.svg');
    if (logoRojoUrl) {
      doc.addImage(logoRojoUrl, 'PNG', xCenter - 15, y, 30, 10);
    }
    y += 15;
    
    // doc.setTextColor(...HEADER_BG);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Celular: 954 862 745', xCenter, y, { align: 'center' }); // Celular genérico, ajustar al de la empresa
    doc.setFontSize(8);
    doc.text('INFINYCAPITAL - SERVICIOS FINANCIEROS', xCenter, y + 5, { align: 'center' });

    // Guardar el PDF
    return doc.output('blob');
  }
}
