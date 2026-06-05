import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { DatePipe } from '@angular/common';
import { PatrimonioResponse } from '../models/patrimonio.model';

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

  async generarReporte(cliente: any, patrimonio?: PatrimonioResponse) {
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

    // Nombre grande
    const nombreCompleto = (c.usuario?.nombreCompleto || c.nombre || `${c.nombres || ''} ${c.apellidoPaterno || ''} ${c.apellidoMaterno || ''}`.trim() || 'CLIENTE').toUpperCase();
    doc.setTextColor(...primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(nombreCompleto, margin, y);
    y += 6;

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${c.tipoDocumento || 'DNI'}: ${c.numeroDocumento || '--'}  |  Estado: ${c.estado || 'ACTIVO'}`, margin, y);
    y += 4;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, 190, y);
    y += 8;

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
      ['Sexo',              this.fmt(c.sexo)],
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
      ['Otros Ingresos Mens.', this.fmtMoney(c.ingresoBrutoMensual)],
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
        ['Nombre Completo',   this.fmt(`${c.conyuge.nombresConyuge || ''} ${c.conyuge.apellidoPaConyuge || ''} ${c.conyuge.apellidoMatConyuge || ''}`.trim())],
        ['Tipo Documento',    this.fmt(c.conyuge.tipoDocumento || 'DNI')],
        ['N° Documento',      this.fmt(c.conyuge.numeroDocumento)],
        ['Celular',           this.fmt(c.conyuge.telefono)],
        ['Ocupación',         this.fmt(c.conyuge.ocupacion)],
        ['Ingresos Mensuales',this.fmtMoney(c.conyuge.ingresosMensuales)],
        ['Dirección',         this.fmt(c.conyuge.direccion)],
      ], y, doc);
    }

    // ── 6. PATRIMONIO ────────────────────────────────────────────
    if (patrimonio && (patrimonio.activos.length > 0 || patrimonio.pasivos.length > 0)) {
      y += 8;
      this.seccion(doc, '6. PATRIMONIO', y, primary);
      y += 10;

      const green:  [number, number, number] = [34,  197, 94];
      const red:    [number, number, number] = [239, 68,  68];

      // ── Activos ────────────────────────────────────────────────
      if (patrimonio.activos.length > 0) {
        if (y > 268) { doc.addPage(); y = 20; }
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...green);
        doc.text('ACTIVOS', 20, y);
        y += 5;

        // Cabecera tabla activos
        doc.setFillColor(240, 253, 244);
        doc.rect(20, y - 3, 170, 7, 'F');
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('TIPO',         22, y + 2);
        doc.text('DESCRIPCIÓN',  70, y + 2);
        doc.text('VALOR (S/)',  150, y + 2, { align: 'right' });
        y += 8;

        for (const a of patrimonio.activos) {
          if (y > 272) { doc.addPage(); y = 20; }
          const tipoLabel = this.tipoActivoLabel(a.tipo);
          const valor = a.valorEstimado != null
            ? `S/ ${Number(a.valorEstimado).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
            : '--';
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 30, 30);
          doc.text(tipoLabel,        22, y);
          doc.text(a.descripcion || '--', 70, y);
          doc.setTextColor(...green);
          doc.text(valor,           150, y, { align: 'right' });
          y += 6;
        }

        // Total activos
        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...green);
        const totalA = `S/ ${Number(patrimonio.totalActivos).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
        doc.text('TOTAL ACTIVOS:', 100, y);
        doc.text(totalA, 150, y, { align: 'right' });
        y += 6;
      }

      // ── Pasivos ────────────────────────────────────────────────
      if (patrimonio.pasivos.length > 0) {
        if (y > 260) { doc.addPage(); y = 20; }
        y += 4;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...red);
        doc.text('PASIVOS', 20, y);
        y += 5;

        // Cabecera tabla pasivos
        doc.setFillColor(255, 241, 242);
        doc.rect(20, y - 3, 170, 7, 'F');
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('TIPO',         22, y + 2);
        doc.text('ENTIDAD',      60, y + 2);
        doc.text('SALDO',       103, y + 2, { align: 'right' });
        doc.text('VENCE',       130, y + 2);
        doc.text('CUOTA/MES',   190, y + 2, { align: 'right' });
        y += 8;

        for (const p of patrimonio.pasivos) {
          if (y > 272) { doc.addPage(); y = 20; }
          const tipoLabel = this.tipoPasivoLabel(p.tipo);
          const saldo = p.montoPendiente != null
            ? `S/ ${Number(p.montoPendiente).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
            : '--';
          const cuota = p.cuotaMensual != null
            ? `S/ ${Number(p.cuotaMensual).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
            : '--';
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 30, 30);
          doc.text(tipoLabel,              22, y);
          doc.text(p.entidadAcreedora || '--', 60, y);
          doc.setTextColor(...red);
          doc.text(saldo,                 103, y, { align: 'right' });
          doc.setTextColor(30, 30, 30);
          doc.text(p.vencimiento   || '--', 108, y);
          doc.setTextColor(...red);
          doc.text(cuota,                 190, y, { align: 'right' });
          y += 6;
        }

        // Total pasivos
        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...red);
        const totalP = `S/ ${Number(patrimonio.totalPasivos).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
        doc.text('TOTAL PASIVOS:', 100, y);
        doc.text(totalP, 150, y, { align: 'right' });
        y += 8;
      }

      // Patrimonio neto
      if (y > 270) { doc.addPage(); y = 20; }
      const neto = patrimonio.patrimonioNeto ?? 0;
      const netoColor: [number, number, number] = neto >= 0 ? green : red;
      const netoStr = `S/ ${Number(neto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(245, 245, 245);
      doc.rect(20, y - 4, 170, 8, 'F');
      doc.setTextColor(60, 60, 60);
      doc.text('PATRIMONIO NETO:', 22, y + 1);
      doc.setTextColor(...netoColor);
      doc.text(netoStr, 188, y + 1, { align: 'right' });
      y += 10;
    }

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

  private tipoActivoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      INMUEBLE: 'Inmueble/Propiedad', AHORROS: 'Ahorros/Depósitos',
      PLAZO_FIJO: 'Plazo Fijo', AUTO: 'Vehículo/Auto', OTRO: 'Otros'
    };
    return labels[tipo] || tipo;
  }

  private tipoPasivoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      TARJETAS: 'Tarjetas Crédito', CORTO_PLAZO: 'Corto Plazo',
      LARGO_PLAZO: 'Largo Plazo', HIPOTECARIO: 'Hipotecario', OTRO: 'Otros'
    };
    return labels[tipo] || tipo;
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
