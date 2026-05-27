import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ReportePerfilPdfService {
  private datePipe = new DatePipe('es-PE');

  constructor() {}

  /** Formatea fechaNacimiento que puede llegar como array, string o Date */
  private formatDate(val: any): string {
    if (!val) return '--';
    if (Array.isArray(val)) {
      const [y, m, d] = val;
      return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
    }
    const str = String(val).trim();
    // YYYY-MM-DD
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return str;
  }

  private fmt(val: any, prefix = ''): string {
    if (val === null || val === undefined || val === '') return '--';
    return prefix + String(val);
  }

  private fmtMoney(val: any): string {
    const n = parseFloat(val);
    if (isNaN(n) || n === 0) return '--';
    return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  async generarReporte(cliente: any) {
    // Merge datosSolicitud into a flat object
    let extra: any = {};
    if (cliente.datosSolicitud && typeof cliente.datosSolicitud === 'string') {
      try { extra = JSON.parse(cliente.datosSolicitud); } catch (e) {}
    }
    const c = { ...extra, ...cliente }; // real columns win over JSON

    // Normalize date after merge
    if (Array.isArray(c.fechaNacimiento)) {
      const [y, mo, d] = c.fechaNacimiento;
      c.fechaNacimiento = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }

    // Pre-load client photo
    const baseUrl = 'https://servicio.infiny-capital.com';
    let fotoDataUrl = '';
    if (c.fotoUrl) {
      try { fotoDataUrl = await this.imageUrlToDataURL(baseUrl + c.fotoUrl); } catch (e) {}
    }

    const doc = new jsPDF();
    const margin = 20;
    const pageW = 190;
    let y = 20;

    // ── Logo + header ──────────────────────────────────────────
    const primary: [number,number,number] = [185, 28, 28];

    let logoDataUrl = '';
    try { logoDataUrl = await this.svgToDataURL('/logo/logo-red.svg', 100, 100); } catch (e) {}
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin, 10, 15, 15);
    } else {
      doc.setFillColor(...primary);
      doc.rect(margin, 10, 12, 12, 'F');
    }

    doc.setTextColor(...primary);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('InfinyCapital', margin + 18, 18);

    doc.setFillColor(...primary);
    doc.rect(margin + 18, 20.5, 38, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text('SERVICIOS FINANCIEROS', margin + 19, 23.5);

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm')}`, 145, 18);

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 33, 190, 33);

    y = 42;

    // ── Foto del cliente (esquina derecha del encabezado) ───────
    // Se dibuja un círculo/cuadro con la foto a la derecha
    const photoSize = 28;
    const photoX = 190 - photoSize; // alineado a la derecha
    const photoY = 36;
    if (fotoDataUrl) {
      // Marco circular con borde rojo
      doc.setDrawColor(...primary);
      doc.setLineWidth(0.8);
      doc.rect(photoX, photoY, photoSize, photoSize, 'S');
      doc.addImage(fotoDataUrl, 'JPEG', photoX + 0.5, photoY + 0.5, photoSize - 1, photoSize - 1);
    } else {
      // Placeholder si no hay foto
      doc.setFillColor(245, 245, 245);
      doc.rect(photoX, photoY, photoSize, photoSize, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(photoX, photoY, photoSize, photoSize, 'S');
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('SIN FOTO', photoX + photoSize / 2, photoY + photoSize / 2 + 1, { align: 'center' });
    }

    // Nombre grande (deja margen a la derecha para la foto)
    const nombreCompleto = (c.usuario?.nombreCompleto || c.nombre || `${c.nombres || ''} ${c.apellidoPaterno || ''} ${c.apellidoMaterno || ''}`.trim() || 'CLIENTE').toUpperCase();
    doc.setTextColor(...primary);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    // Limitar ancho del nombre para que no choque con la foto
    const nombreLines = doc.splitTextToSize(nombreCompleto, 140);
    doc.text(nombreLines, margin, y);
    y += nombreLines.length * 6;

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${c.tipoDocumento || 'DNI'}: ${c.numeroDocumento || '--'}  |  Estado: ${c.estado || 'ACTIVO'}`, margin, y);
    y += 4;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, 190, y);
    // Aseguramos que y no quede dentro del área de la foto
    y = Math.max(y + 8, photoY + photoSize + 6);

    // ── 1. DATOS PERSONALES ─────────────────────────────────────
    this.seccion(doc, '1. DATOS PERSONALES', y, primary); y += 10;
    y = this.grid(doc, [
      ['Tipo de Persona',    this.fmt(c.tipoPersona)],
      ['Nombres',           this.fmt(c.nombres)],
      ['Apellido Paterno',  this.fmt(c.apellidoPaterno)],
      ['Apellido Materno',  this.fmt(c.apellidoMaterno)],
      ['Tipo Documento',    this.fmt(c.tipoDocumento)],
      ['Nro. Documento',    this.fmt(c.numeroDocumento)],
      ['Fecha Nacimiento',  this.formatDate(c.fechaNacimiento)],
      ['Estado Civil',      this.fmt(c.estadoCivil)],
      ['Grado Instrucción', this.fmt(c.gradoInstruccion)],
      ['Nro. Dependientes', this.fmt(c.numeroDependientes)],
      ['Nacionalidad',      this.fmt(c.nacionalidad)],
      ['Celular',           this.fmt(c.celular)],
      ['Teléfono',          this.fmt(c.telefono)],
      ['Correo',            this.fmt(c.usuario?.email)],
      ['Vive Casa Propia',  c.viveCasaPropia === true ? 'Sí' : (c.viveCasaPropia === false ? 'No' : '--')],
      ['Canal Edo. Cuenta', this.fmt(c.canalEstadoCuenta)],
      ['Contacto Familiar', this.fmt(c.contactoFamiliarNombre)],
      ['Cel. Familiar',     this.fmt(c.contactoFamiliarCelular)],
      ['Límite Crédito',    this.fmtMoney(c.limiteCredito)],
    ], y, doc);

    // ── 2. PERSONA JURÍDICA (solo si aplica) ────────────────────
    if (c.tipoPersona === 'JURIDICA') {
      y += 8; this.seccion(doc, '2. DATOS JURÍDICOS', y, primary); y += 10;
      y = this.grid(doc, [
        ['Razón Social',       this.fmt(c.razonSocialJuridica)],
        ['RUC Jurídico',       this.fmt(c.rucJuridico)],
        ['Representante Legal',this.fmt(c.representanteLegal)],
      ], y, doc);
    }

    // ── 3. SITUACIÓN LABORAL ────────────────────────────────────
    y += 8; this.seccion(doc, '3. SITUACIÓN LABORAL', y, primary); y += 10;
    y = this.grid(doc, [
      ['Situación Laboral',   this.fmt(c.situacionLaboral)],
      ['Empresa',             this.fmt(c.empresa)],
      ['Cargo / Ocupación',   this.fmt(c.cargoOcupacion)],
      ['RUC Empresa',         this.fmt(c.rucEmpresa)],
      ['RUC Propio',          this.fmt(c.rucPropio)],
      ['Fecha Ingreso Lab.',  this.fmt(c.fechaIngresoLaboral)],
      ['Ingreso Mensual',     this.fmtMoney(c.ingresoMensual)],
      ['Ingreso Bruto Mens.', this.fmtMoney(c.ingresoBrutoMensual)],
      ['Otros Ingresos',      this.fmtMoney(c.otrosIngresos)],
      ['Tipo de Renta',       this.fmt(c.tipoRenta)],
      ['Nombre Negocio',      this.fmt(c.nombrePropioNegocio)],
      ['Dir. Empresa',        this.fmt(c.direccionEmpresa)],
      ['Telef. Empresa',      this.fmt(c.telefonoEmpresa)],
    ], y, doc);

    // ── 4. UBICACIÓN Y DOMICILIO ────────────────────────────────
    y += 8; this.seccion(doc, '4. UBICACIÓN Y DOMICILIO', y, primary); y += 10;
    y = this.grid(doc, [
      ['Dirección / Domicilio', this.fmt(c.domicilio || c.direccion)],
      ['Departamento',          this.fmt(c.departamento)],
      ['Provincia',             this.fmt(c.provincia)],
      ['Distrito',              this.fmt(c.distrito)],
      ['Urbanización',          this.fmt(c.urbanizacion)],
      ['Manzana',               this.fmt(c.manzana)],
      ['Lote',                  this.fmt(c.lote)],
      ['Código Postal',         this.fmt(c.codigoPostal)],
      ['Referencia',            this.fmt(c.referencia)],
    ], y, doc);

    // ── 5. CÓNYUGE ──────────────────────────────────────────────
    if (c.conyuge) {
      y += 8; this.seccion(doc, '5. INFORMACIÓN DEL CÓNYUGE', y, primary); y += 10;
      y = this.grid(doc, [
        ['Nombre Completo',   this.fmt(c.conyuge.nombreCompleto)],
        ['DNI',               this.fmt(c.conyuge.dni)],
        ['Celular',           this.fmt(c.conyuge.telefono)],
        ['Ocupación',         this.fmt(c.conyuge.ocupacion)],
        ['Ingresos Mensuales',this.fmtMoney(c.conyuge.ingresosMensuales)],
        ['Dirección',         this.fmt(c.conyuge.direccion)],
      ], y, doc);
    }

    // ── Pie de página ───────────────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`InfinyCapital - Reporte Confidencial - Página ${i} de ${pageCount}`, 105, 287, { align: 'center' });
    }

    doc.save(`Perfil_${c.numeroDocumento || 'cliente'}.pdf`);
  }

  private seccion(doc: jsPDF, titulo: string, y: number, color: [number,number,number]) {
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFillColor(245, 245, 245);
    doc.rect(20, y - 5, 170, 7, 'F');
    doc.setTextColor(...color);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, 25, y);
  }

  /** Two-column grid: left col 20–90, right col 100–190 */
  private grid(doc: jsPDF, rows: [string, string][], startY: number, _doc: jsPDF): number {
    let y = startY;
    doc.setFontSize(8);

    for (let i = 0; i < rows.length; i += 2) {
      if (y > 272) { doc.addPage(); y = 20; }

      // Left cell
      this.cell(doc, rows[i][0], rows[i][1], 20, y);

      // Right cell (if exists)
      if (i + 1 < rows.length) {
        this.cell(doc, rows[i + 1][0], rows[i + 1][1], 105, y);
      }

      y += 8;
    }
    return y;
  }

  private cell(doc: jsPDF, label: string, value: string, x: number, y: number) {
    const colW = 80;
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), x, y);

    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    const split = doc.splitTextToSize(value, colW);
    doc.text(split, x, y + 4);
  }

  private imageUrlToDataURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } else {
          reject('Canvas context not available');
        }
      };
      img.onerror = () => reject('Error loading image: ' + url);
      img.src = url;
    });
  }

  private svgToDataURL(url: string, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject('Canvas context not available');
        }
      };
      img.onerror = () => reject('Error loading SVG');
      img.src = url;
    });
  }
}
