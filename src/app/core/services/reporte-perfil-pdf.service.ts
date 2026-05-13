import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Cliente } from '../models/cliente.model';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ReportePerfilPdfService {
  private datePipe = new DatePipe('en-US');

  constructor() {}

  async generarReporte(cliente: Cliente) {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Intentar convertir SVG a PNG para compatibilidad
    let logoDataUrl = '';
    try {
      logoDataUrl = await this.svgToDataURL('/logo/logo-red.svg', 100, 100);
    } catch (e) {}

    // Colores corporativos (Rojo)
    const primary = [185, 28, 28]; // #B91C1C
    const textGray = [156, 163, 175]; // text-base-content/40

    // Encabezado Limpio (estilo Sidebar)
    // Logo y Nombre (Replicando Sidebar)
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin, 10, 15, 15);
    } else {
      // Fallback si falla el SVG
      doc.setFillColor(primary[0], primary[1], primary[2]);
      doc.rect(margin, 10, 12, 12, 'F');
    }

    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('InfinyCapital', margin + 18, 18);
    
    // Badge "Servicios financieros"
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(margin + 18, 20.5, 38, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICIOS FINANCIEROS', margin + 19, 23.5);

    // Fecha a la derecha
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm')}`, 145, 18);

    // Línea divisoria elegante
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, 35, 190, 35);

    y = 50;

    // 1. INFORMACIÓN PERSONAL
    this.dibujarSeccion(doc, '1. INFORMACIÓN PERSONAL Y DE IDENTIDAD', y, primary);
    y += 10;
    
    const datosPersonales = [
      ['Nombre Completo:', cliente.nombre],
      ['Documento:', `${cliente.tipoDocumento || 'DNI'} ${cliente.numeroDocumento}`],
      ['Fecha de Nacimiento:', this.datePipe.transform(cliente.fechaNacimiento, 'dd/MM/yyyy') || '--'],
      ['Estado Civil:', cliente.estadoCivil || '--'],
      ['Nacionalidad:', cliente.nacionalidad || 'PERUANA'],
      ['Grado Instrucción:', cliente.gradoInstruccion || '--'],
      ['Celular:', cliente.celular || '--'],
      ['Teléfono Fijo:', cliente.telefono || '--'],
      ['Correo:', cliente.usuario?.email || '--']
    ];
    y = this.dibujarGrid(doc, datosPersonales, y);

    // Contacto Familiar y Vivienda
    y += 5;
    const datosAdicionales = [
      ['Contacto Familiar:', cliente.contactoFamiliarNombre || '--'],
      ['Celular Familiar:', cliente.contactoFamiliarCelular || '--'],
      ['Tipo de Vivienda:', cliente.viveCasaPropia ? 'CASA PROPIA' : 'ALQUILADA / OTRO'],
      ['Estado en Sistema:', cliente.estado],
      ['Límite de Crédito:', `S/ ${(cliente.limiteCredito || 0).toLocaleString('es-PE')}`]
    ];
    y = this.dibujarGrid(doc, datosAdicionales, y);

    // 2. INFORMACIÓN LABORAL
    y += 15;
    this.dibujarSeccion(doc, '2. SITUACIÓN ECONÓMICA Y LABORAL', y, primary);
    y += 10;
    
    const datosLaborales = [
      ['Situación Laboral:', cliente.situacionLaboral || '--'],
      ['Empresa:', cliente.empresa || '--'],
      ['Cargo / Ocupación:', cliente.cargoOcupacion || '--'],
      ['RUC Empresa:', cliente.rucEmpresa || '--'],
      ['Ingreso Mensual:', `S/ ${(cliente.ingresoMensual || 0).toLocaleString('es-PE')}`],
      ['Dirección Empresa:', cliente.direccionEmpresa || '--'],
      ['Teléfono Empresa:', cliente.telefonoEmpresa || '--']
    ];
    y = this.dibujarGrid(doc, datosLaborales, y);

    // 3. UBICACIÓN Y DOMICILIO
    y += 15;
    this.dibujarSeccion(doc, '3. UBICACIÓN Y DOMICILIO', y, primary);
    y += 10;

    let extra: any = {};
    if (cliente.datosSolicitud) {
        try { extra = JSON.parse(cliente.datosSolicitud); } catch (e) {}
    }

    const datosUbicacion = [
      ['Dirección / Domicilio:', cliente.domicilio || cliente.direccion || '--'],
      ['Departamento:', cliente.departamento || extra.departamento || '--'],
      ['Provincia:', cliente.provincia || extra.provincia || '--'],
      ['Distrito:', cliente.distrito || extra.distrito || '--'],
      ['Urbanización:', cliente.urbanizacion || extra.urbanizacion || '--'],
      ['MZ / Lote:', `MZ: ${cliente.manzana || extra.manzana || '--'} - LT: ${cliente.lote || extra.lote || '--'}`],
      ['Referencia:', cliente.referencia || extra.referencia || '--']
    ];
    y = this.dibujarGrid(doc, datosUbicacion, y);

    // 4. INFORMACIÓN DEL CÓNYUGE
    if (cliente.conyuge) {
        y += 15;
        if (y > 250) { doc.addPage(); y = 20; }
        this.dibujarSeccion(doc, '4. INFORMACIÓN DEL CÓNYUGE', y, primary);
        y += 10;
        
        const datosConyuge = [
          ['Nombre Completo:', cliente.conyuge.nombreCompleto],
          ['DNI:', cliente.conyuge.dni],
          ['Celular:', cliente.conyuge.telefono || '--'],
          ['Ocupación:', cliente.conyuge.ocupacion || '--'],
          ['Ingresos Mensuales:', `S/ ${(cliente.conyuge.ingresosMensuales || 0).toLocaleString('es-PE')}`],
          ['Dirección:', cliente.conyuge.direccion || '--']
        ];
        y = this.dibujarGrid(doc, datosConyuge, y);
    }

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`InfinyCapital - Reporte Confidencial - Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    }

    doc.save(`Perfil_Cliente_${cliente.numeroDocumento}.pdf`);
  }

  private dibujarSeccion(doc: jsPDF, titulo: string, y: number, color: number[]) {
    doc.setFillColor(245, 245, 245);
    doc.rect(20, y - 5, 170, 7, 'F');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, 25, y);
  }

  private dibujarGrid(doc: jsPDF, data: string[][], startY: number): number {
    let currentY = startY;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    data.forEach((row, index) => {
        if (currentY > 275) {
            doc.addPage();
            currentY = 20;
        }
        
        // Label
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'bold');
        doc.text(row[0], 25, currentY);
        
        // Value
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        // Manejar texto largo (wrapping)
        const textValue = String(row[1]);
        const splitValue = doc.splitTextToSize(textValue, 100);
        doc.text(splitValue, 70, currentY);
        
        currentY += (splitValue.length * 5) + 1;
    });
    
    return currentY;
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
