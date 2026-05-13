import { Injectable } from '@angular/core';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Credito } from '../models/credito.model';
import { FinancieroHelper } from '../utils/financiero.helper';

@Injectable({
  providedIn: 'root'
})
export class ContratoPdfService {
  private readonly TEMPLATE_URL = '/pdf/contrato_template.pdf';

  // Coordenadas portadas del legacy (v5.6)
  private readonly COORDS: any = {
    "dni_check": { "x": 34, "y": 686, "page": 0 },
    "dni_digits": { "startX": 345, "y": 692, "spacing": 9.7, "page": 0 },
    "apellido_paterno": { "x": 107, "y": 665, "page": 0 },
    "apellido_materno": { "x": 279, "y": 665, "page": 0 },
    "nombres": { "x": 463, "y": 665, "page": 0 },
    "nacionalidad": { "x": 476, "y": 650, "page": 0 },
    "check_secundaria": { "x": 89, "y": 512, "page": 0 },
    "check_tecnica": { "x": 153, "y": 512, "page": 0 },
    "check_universitaria": { "x": 208, "y": 512, "page": 0 },
    "check_completa": { "x": 262, "y": 511, "page": 0 },
    "check_incompleta": { "x": 318, "y": 510, "page": 0 },
    "fecha_solicitud_digits": { "startX": 380, "y": 779, "spacing": 5.99, "page": 0 },
    "fecha_nacimiento_digits": { "startX": 131, "y": 650, "spacing": 5.99, "page": 0 },
    "check_estudios": { "x": 35, "y": 740, "page": 0 },
    "check_efectivo": { "x": 81, "y": 741, "page": 0 },
    "check_vehicular": { "x": 129, "y": 741, "page": 0 },
    "departamento": { "x": 490, "y": 538, "page": 0 },
    "provincia": { "x": 375, "y": 538, "page": 0 },
    "distrito": { "x": 248, "y": 538, "page": 0 },
    "direccion": { "x": 145, "y": 563, "page": 0 },
    "mz": { "x": 287, "y": 563, "page": 0 },
    "lt": { "x": 309, "y": 563, "page": 0 },
    "monto_solicitado": { "x": 103, "y": 490, "page": 1 },
    "tasa": { "x": 250, "y": 490, "page": 1 },
    "plazo_meses": { "x": 76, "y": 579, "page": 1 },
    "dia_pago": { "x": 528, "y": 545, "page": 1 },
    "correo_envio": { "x": 139, "y": 360, "page": 1 },
    "firma_titular_nombre": { "x": 70, "y": 150, "page": 7 },
    "firma_titular_dni": { "x": 70, "y": 120, "page": 7 }
  };

  constructor() {}

  async generarContrato(credito: Credito): Promise<Blob> {
    const response = await fetch(this.TEMPLATE_URL);
    const templateBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const black = rgb(0, 0, 0);

    // Helpers
    const drawText = (val: any, coordKey: string, isBold = false) => {
      const coord = this.COORDS[coordKey];
      if (!val || !coord) return;
      pages[coord.page].drawText(String(val).toUpperCase(), {
        x: coord.x, y: coord.y - 4,
        size: 9, font: isBold ? fontBold : font, color: black
      });
    };

    const drawCheck = (condition: boolean, coordKey: string) => {
      const coord = this.COORDS[coordKey];
      if (condition && coord) {
        pages[coord.page].drawText('X', {
          x: coord.x - 2.5, y: coord.y - 3.5,
          size: 10, font: fontBold, color: black
        });
      }
    };

    const drawDigits = (val: any, coordKey: string) => {
      const coord = this.COORDS[coordKey];
      if (!val || !coord) return;
      const digits = String(val).replace(/\D/g, '');
      const spacing = coord.spacing || 14;
      const centerX = coord.startX;
      const startOffset = (digits.length - 1) / 2 * spacing;

      for (let i = 0; i < digits.length; i++) {
        const charWidth = font.widthOfTextAtSize(digits[i], 10);
        const x = centerX - startOffset + (i * spacing) - (charWidth / 2) + 0.7;
        pages[coord.page].drawText(digits[i], {
          x: x, y: coord.y - 3,
          size: 10, font: font, color: black
        });
      }
    };

    const cliente: any = (credito.cliente || {});
    // Extraer datosSolicitud si vienen en JSON string
    let extra: any = {};
    if (cliente.datosSolicitud) {
        try { extra = JSON.parse(cliente.datosSolicitud); } catch (e) {}
    }

    // 1. Identidad
    drawCheck(cliente.tipoDocumento === 'DNI' || !cliente.tipoDocumento, 'dni_check');
    drawDigits(cliente.numeroDocumento, 'dni_digits');
    drawText(cliente.nombre?.split(' ')[0] || '--', 'nombres');
    drawText(cliente.nombre?.split(' ').slice(1).join(' ') || '--', 'apellido_paterno', true);
    drawText(extra.nacionalidad || 'PERUANA', 'nacionalidad');
    
    // Fechas
    const formatDate = (dateStr: any) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`;
    };
    drawDigits(formatDate(credito.fechaSolicitud), 'fecha_solicitud_digits');
    drawDigits(formatDate(cliente.fechaNacimiento), 'fecha_nacimiento_digits');

    // 2. Ubicación
    drawText(cliente.departamento || extra.departamento, 'departamento');
    drawText(cliente.provincia || extra.provincia, 'provincia');
    drawText(cliente.distrito || extra.distrito, 'distrito');
    drawText(cliente.domicilio || extra.direccion, 'direccion');

    // 3. Crédito
    drawText(`S/ ${credito.montoAprobado || credito.montoCredito}`, 'monto_solicitado', true);
    drawText(`${credito.tasaAprobada || credito.tem || 0}%`, 'tasa', true);
    drawText(`${credito.plazoMeses} meses`, 'plazo_meses');
    drawText(cliente.usuario?.email || '--', 'correo_envio');

    // 4. Cronograma (Página 9)
    pdfDoc.removePage(8); // Limpiar hoja sucia
    const p9 = pdfDoc.addPage([595, 842]);
    this.drawFullCronograma(p9, credito, font, fontBold);

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  }

  private drawFullCronograma(page: any, data: Credito, font: any, fontBold: any) {
    const headT = 780;
    const tabT = 650;
    const rowH = 18;
    const cols = [40, 90, 40, 60, 60, 50, 50, 80];
    const headers = ["Cuota", "Vencimiento", "Días", "Capital", "Interés", "Comis.", "Seguros", "Importe"];

    // Datos Financieros
    const cuotas = FinancieroHelper.calcularAmortizacionFrancesa(
        data.montoAprobado || data.montoCredito || 0,
        data.plazoMeses || 12,
        data.tem || 5,
        data.periodoGracia || 0
    );

    // Encabezado
    page.drawText("CRONOGRAMA DE PAGOS REFERENCIAL", { x: 40, y: headT, size: 14, font: fontBold });
    page.drawText(`Monto: S/ ${(data.montoAprobado || data.montoCredito || 0).toLocaleString('es-PE')}`, { x: 40, y: headT - 25, size: 10, font });
    page.drawText(`Plazo: ${data.plazoMeses} meses`, { x: 40, y: headT - 39, size: 10, font });

    // Cabecera Tabla
    page.drawRectangle({ x: 35, y: tabT, width: 500, height: rowH, color: rgb(0.8, 0.1, 0.1) });
    let curX = 35;
    headers.forEach((h, idx) => {
        page.drawText(h, { x: curX + 5, y: tabT + 5, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
        curX += cols[idx];
    });

    // Filas
    cuotas.forEach((c, idx) => {
        const y = tabT - ((idx + 1) * rowH);
        page.drawRectangle({ x: 35, y: y, width: 500, height: rowH, borderWidth: 0.5, borderColor: rgb(0.5, 0.5, 0.5) });
        
        let rX = 35;
        const rowData = [
            String(c.numero),
            c.fecha.toLocaleDateString('es-PE'),
            "30",
            c.capital.toFixed(2),
            c.interes.toFixed(2),
            "0.00", "0.00",
            c.total.toFixed(2)
        ];

        rowData.forEach((val, j) => {
            const numeric = j > 2;
            const tX = numeric ? (rX + cols[j] - font.widthOfTextAtSize(val, 8) - 5) : (rX + 5);
            page.drawText(val, { x: tX, y: y + 5, size: 8, font });
            rX += cols[j];
        });
    });
  }

  async descargarPDF(credito: Credito) {
    const blob = await this.generarContrato(credito);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contrato_#${credito.id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
