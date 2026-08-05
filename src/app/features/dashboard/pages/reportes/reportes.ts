import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ThemeService } from '../../../../core/services/theme.service';
import { LucideAngularModule } from 'lucide-angular';
import { ReporteService } from '../../../../core/services/reporte.service';
import { CreditoService } from '../../../../core/services/credito.service';
import jsPDF from 'jspdf';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule, LucideAngularModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit, OnDestroy {
  themeService = inject(ThemeService);
  reporteService = inject(ReporteService);
  creditoService = inject(CreditoService);

  selectedYear = '2026';
  selectedMonth = 'todos';
  selectedBranch = 'todas';
  isApplyingFilters = signal(false);
  isFullscreen = signal(false);

  capitalTotalCard = signal(458760);
  interesesGanadosCard = signal(32680);
  carteraActivaCard = signal(325450);
  creditosVigentesCard = signal(1248);

  textColor = computed(() => this.themeService.darkMode() ? '#e2e8f0' : '#334155');
  titleColor = computed(() => this.themeService.darkMode() ? '#ffffff' : '#0f172a');
  gridColor = computed(() => this.themeService.darkMode() ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)');

  mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  ngOnInit() {
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    this.isApplyingFilters.set(true);
    
    this.reporteService.getDashboardData(this.selectedYear, this.selectedMonth, this.selectedBranch).subscribe({
      next: (data: any) => {
        
        // 1. Ganancia Mensual
        this.gananciaMensualData = {
          ...this.gananciaMensualData,
          datasets: [{ ...this.gananciaMensualData.datasets[0], data: data.gananciaMensual }]
        };

        // 1.5 Ganancia Anual
        this.gananciaAnualData = {
          labels: data.aniosGanancia,
          datasets: [{ ...this.gananciaAnualData.datasets[0], data: data.gananciaAnual }]
        };

        // 2. Capital e Intereses
        this.capIntData = {
          ...this.capIntData,
          datasets: [
            { ...this.capIntData.datasets[0], data: data.capitalCanceladoMensual },
            { ...this.capIntData.datasets[1], data: data.interesesCanceladosMensual }
          ]
        };

        // 3. Clasificacion Clientes
        this.semaforoData = {
          ...this.semaforoData,
          datasets: [{
            ...this.semaforoData.datasets[0],
            data: [
              data.clientesNormal,
              data.clientesProblemas,
              data.clientesDeficiente,
              data.clientesDudoso,
              data.clientesPerdida
            ]
          }]
        };

        // 4. Monto a Recibir vs Recibido
        this.recibirVsRecibidoData = {
          ...this.recibirVsRecibidoData,
          datasets: [
            { ...this.recibirVsRecibidoData.datasets[0], data: data.montoARecibirMensual },
            { ...this.recibirVsRecibidoData.datasets[1], data: data.montoRecibidoMensual }
          ]
        };

        // 5. Ganancias vs Perdidas
        this.gananciaPerdidaData = {
          ...this.gananciaPerdidaData,
          datasets: [
            { ...this.gananciaPerdidaData.datasets[0], data: data.gananciaMensual },
            { ...this.gananciaPerdidaData.datasets[1], data: data.perdidasMensuales }
          ]
        };

        // Compute cards metrics
        const totalCap = (data.capitalCanceladoMensual || []).reduce((a: number, b: number) => a + b, 0);
        this.capitalTotalCard.set(totalCap || 458760);
        
        const totalInt = (data.interesesCanceladosMensual || []).reduce((a: number, b: number) => a + b, 0);
        this.interesesGanadosCard.set(totalInt || 32680);

        const totalCartera = (data.montoARecibirMensual || []).reduce((a: number, b: number) => a + b, 0);
        this.carteraActivaCard.set(totalCartera || 325450);

        const totalCreditos = (data.clientesNormal || 0) + (data.clientesProblemas || 0) + (data.clientesDeficiente || 0) + (data.clientesDudoso || 0);
        this.creditosVigentesCard.set(totalCreditos || 1248);

        this.isApplyingFilters.set(false);
      },
      error: () => {
        console.error('Error fetching dashboard data');
        this.isApplyingFilters.set(false);
      }
    });
  }

  // Define format callback helper
  private formatMoney(value: any) {
    return 'S/ ' + Number(value).toLocaleString('es-PE');
  }

  // 1. Ganancia Mensual
  public gananciaMensualOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: true, text: 'Ganancia Mensual', color: this.titleColor() } },
    scales: { y: { ticks: { color: this.textColor(), callback: (v) => this.formatMoney(v) }, grid: { color: this.gridColor() } }, x: { ticks: { color: this.textColor() }, grid: { display: false } } }
  }));
  public gananciaMensualData: ChartData<'bar'> = {
    labels: this.mesesLabels,
    datasets: [{ data: [], label: 'Ganancia', backgroundColor: '#dc2626', borderRadius: 6 }]
  };

  // 1.5 Ganancia Anual
  public gananciaAnualOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: true, text: 'Ganancia Anual', color: this.titleColor() } },
    scales: { y: { ticks: { color: this.textColor(), callback: (v) => this.formatMoney(v) }, grid: { color: this.gridColor() } }, x: { ticks: { color: this.textColor() }, grid: { display: false } } }
  }));
  public gananciaAnualData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Ganancia', backgroundColor: '#ef4444', borderRadius: 6 }]
  };

  // 2. Capital e Intereses
  public capIntOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: this.textColor() } }, title: { display: true, text: 'Capital e Intereses Cancelados', color: this.titleColor() } },
    scales: {
      y: { stacked: true, ticks: { color: this.textColor(), callback: (v) => this.formatMoney(v) }, grid: { color: this.gridColor() } },
      x: { stacked: true, ticks: { color: this.textColor() }, grid: { display: false } }
    }
  }));
  public capIntData: ChartData<'bar'> = {
    labels: this.mesesLabels,
    datasets: [
      { data: [], label: 'Capital Cancelado', backgroundColor: '#dc2626', borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 6, bottomRight: 6 } },
      { data: [], label: 'Intereses Cancelados', backgroundColor: '#fca5a5', borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 } }
    ]
  };

  // 3. Clasificación de Clientes
  public semaforoOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { color: this.textColor() } }, title: { display: true, text: 'Clasificación de Clientes (Riesgo)', color: this.titleColor() } }
  }));
  public semaforoData: ChartData<'doughnut'> = {
    labels: ['Normal', 'Problemas Potenciales', 'Deficiente', 'Dudoso', 'Pérdida'],
    datasets: [{
      data: [],
      backgroundColor: ['#dc2626', '#fbbf24', '#f97316', '#ef4444', '#7f1d1d'],
      borderWidth: 0
    }]
  };

  // 4. Monto a recibir vs recibido
  public recibirVsRecibidoOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: this.textColor() } }, title: { display: true, text: 'Monto a Recibir vs Recibido', color: this.titleColor() } },
    scales: { y: { ticks: { color: this.textColor(), callback: (v) => this.formatMoney(v) }, grid: { color: this.gridColor() } }, x: { ticks: { color: this.textColor() }, grid: { display: false } } }
  }));
  public recibirVsRecibidoData: ChartData<'line'> = {
    labels: this.mesesLabels,
    datasets: [
      { data: [], label: 'A Recibir (Proyectado)', borderColor: '#fca5a5', borderDash: [5, 5], backgroundColor: 'transparent', tension: 0.4 },
      { data: [], label: 'Recibido (Real)', borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', fill: true, tension: 0.4 }
    ]
  };

  // 5. Ganancias vs Perdidas
  public gananciaPerdidaOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: this.textColor() } }, title: { display: true, text: 'Ganancias vs Pérdidas', color: this.titleColor() } },
    scales: { y: { ticks: { color: this.textColor(), callback: (v) => this.formatMoney(v) }, grid: { color: this.gridColor() } }, x: { ticks: { color: this.textColor() }, grid: { display: false } } }
  }));
  public gananciaPerdidaData: ChartData<'line'> = {
    labels: this.mesesLabels,
    datasets: [
      { data: [], label: 'Ganancias', borderColor: '#dc2626', backgroundColor: 'transparent', tension: 0.4 },
      { data: [], label: 'Pérdidas', borderColor: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.1)', fill: true, tension: 0.4 }
    ]
  };

  exportarPdf() {
    this.isApplyingFilters.set(true);
    const canvases = document.querySelectorAll('#pdf-content canvas') as NodeListOf<HTMLCanvasElement>;
    if (canvases.length >= 6) {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const isDark = this.themeService.darkMode();
        if (isDark) {
          pdf.setFillColor(17, 24, 39);
          pdf.rect(0, 0, 210, 297, 'F');
        }
        pdf.setFontSize(16);
        pdf.setTextColor(isDark ? 243 : 40, isDark ? 244 : 40, isDark ? 246 : 40);
        pdf.text('Reporte Financiero Completo', 14, 15);
        pdf.setFontSize(10);
        pdf.text(`Año: ${this.selectedYear} | Mes: ${this.selectedMonth} | Sucursal: ${this.selectedBranch}`, 14, 22);

        const img1 = canvases[0].toDataURL('image/png', 1.0);
        const img2 = canvases[1].toDataURL('image/png', 1.0);
        const img3 = canvases[2].toDataURL('image/png', 1.0);
        const img4 = canvases[3].toDataURL('image/png', 1.0);
        const img5 = canvases[4].toDataURL('image/png', 1.0);
        const img6 = canvases[5].toDataURL('image/png', 1.0);

        pdf.addImage(img1, 'PNG', 10, 30, 90, 60);
        pdf.addImage(img2, 'PNG', 110, 30, 90, 60);
        pdf.addImage(img3, 'PNG', 10, 95, 190, 60);
        pdf.addImage(img5, 'PNG', 10, 160, 90, 60);
        pdf.addImage(img6, 'PNG', 110, 160, 90, 60);
        
        pdf.addPage();
        if (isDark) {
          pdf.setFillColor(17, 24, 39);
          pdf.rect(0, 0, 210, 297, 'F');
        }
        pdf.addImage(img4, 'PNG', 40, 20, 130, 80);

        pdf.save(`Reporte_InfinityCapital_${this.selectedYear}.pdf`);
      } catch (err) {
        console.error('Error generando PDF', err);
      }
    }
    this.isApplyingFilters.set(false);
  }

  private formatearNombreCliente(cliente: any, credito: any, extra: any): string {
    let nombreFormateado = cliente?.nombre || credito?.nombreCliente || '';
    const isJuridica = cliente?.tipoPersona === 'JURIDICA' || cliente?.tipoDocumento === 'RUC';
    if (!isJuridica && (extra.apellidoPaterno || extra.nombres)) {
      const paterno = extra.apellidoPaterno || '';
      const materno = extra.apellidoMaterno || '';
      const nombres = extra.nombres || '';
      nombreFormateado = `${paterno} ${materno} ${nombres}`.replace(/\s+/g, ' ').trim();
    }
    return nombreFormateado;
  }

  private formatearFechaStr(fechaInput: any): string {
    if (!fechaInput) return '';
    const d = new Date(fechaInput);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  private extraerExtra(cliente: any) {
    let extra = {} as any;
    if (cliente?.datosSolicitud) {
      try {
        extra = typeof cliente.datosSolicitud === 'string' 
                    ? JSON.parse(cliente.datosSolicitud) 
                    : cliente.datosSolicitud;
      } catch(e) {}
    }
    return extra;
  }

  private async generarExcelBase(nombreArchivo: string, sheetName: string, columnas: any[], dataItems: any[], mapRowFn: (item: any) => any) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      try {
        const logoRes = await fetch('/logo/LOGO-INFINY.png');
        if (logoRes.ok) {
          const logoBlob = await logoRes.blob();
          const logoBuffer = await logoBlob.arrayBuffer();
          const logoId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
          worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 180, height: 60 } });
        }
      } catch (e) {
        console.warn('No se pudo cargar el logo', e);
      }

      worksheet.mergeCells('A1:T5');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'FORMATO PARA COBRANZA BLANCA';
      titleCell.font = { size: 24, bold: true, color: { argb: 'FF003366' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.getRow(6).values = columnas.map(c => c.titulo);
      worksheet.getRow(6).eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C78' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        const colInfo = columnas[colNumber - 1];
        if (colInfo) {
          worksheet.getColumn(colNumber).width = colInfo.width;
        }
      });

      dataItems.forEach((item) => {
        const rowData = mapRowFn(item);
        worksheet.addRow(columnas.map(col => (rowData as any)[col.key]));
      });

      // LEYENDA (Separada de la tabla principal)
      const startColLeyenda = columnas.length + 2; 
      let rowLeyenda = 6;
      
      const addLeyendaHeader = (texto: string) => {
        const cell = worksheet.getCell(rowLeyenda, startColLeyenda);
        cell.value = texto;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
        cell.alignment = { horizontal: 'center' };
        worksheet.getColumn(startColLeyenda).width = 25;
        worksheet.getColumn(startColLeyenda + 1).width = 25;
        worksheet.mergeCells(rowLeyenda, startColLeyenda, rowLeyenda, startColLeyenda + 1);
        rowLeyenda++;
      };

      const addLeyendaItem = (clave: string, valor: string) => {
        worksheet.getCell(rowLeyenda, startColLeyenda).value = clave;
        worksheet.getCell(rowLeyenda, startColLeyenda).font = { bold: true };
        worksheet.getCell(rowLeyenda, startColLeyenda + 1).value = valor;
        rowLeyenda++;
      };

      addLeyendaHeader('LEYENDA DE CÓDIGOS');
      
      addLeyendaItem('TIPO DOCUMENTO ID:', '');
      addLeyendaItem('1', 'DNI');
      addLeyendaItem('3', 'Carnet de extranjería');
      addLeyendaItem('6', 'RUC');
      
      rowLeyenda++;
      addLeyendaItem('TIPO DE DEUDOR:', '');
      addLeyendaItem('1', 'Directo (Deudor)');
      addLeyendaItem('2', 'Indirecto (Aval)');

      rowLeyenda++;
      addLeyendaItem('TIPO DE DOCUMENTO:', '');
      addLeyendaItem('BV', 'Boleta de Venta');
      addLeyendaItem('FA', 'Factura');
      addLeyendaItem('LT', 'Letra');
      addLeyendaItem('PG', 'Pagaré');
      addLeyendaItem('RC', 'Recibo');

      rowLeyenda++;
      addLeyendaItem('TIPO DE MONEDA:', '');
      addLeyendaItem('1', 'Soles');
      addLeyendaItem('2', 'Dólares');
      
      rowLeyenda++;
      addLeyendaItem('CONDICIÓN DE LA DEUDA:', '');
      addLeyendaItem('(Vacío)', 'Moroso');
      addLeyendaItem('P', 'Protestado');
      addLeyendaItem('J', 'Judicial');
      addLeyendaItem('C', 'Castigado');

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${nombreArchivo}_${this.formatearFechaStr(new Date())}.xlsx`);
      
    } catch (error) {
      console.error('Error al generar Excel', error);
    } finally {
      this.isApplyingFilters.set(false);
    }
  }

  private generarRowDataCredito(credito: any) {
    const cliente = credito.cliente || {} as any;
    const extra = this.extraerExtra(cliente);
    const nombreFormateado = this.formatearNombreCliente(cliente, credito, extra);

    return {
      fechaReporte: this.formatearFechaStr(new Date()),
      codigoEntidad: 'INF-CAPITAL',
      numeroCredito: credito.id?.toString(),
      tipoDocumentoId: cliente.tipoDocumento === 'DNI' ? '1' : (cliente.tipoDocumento === 'RUC' ? '6' : '3'),
      numeroDocumento: cliente.numeroDocumento || '',
      tipoDeudor: '1',
      nombre: nombreFormateado,
      direccion: cliente.direccion || cliente.domicilio || extra.direccion || '',
      distrito: cliente.distrito || extra.distrito || '',
      departamento: cliente.departamento || extra.departamento || '',
      fechaVencimiento: this.formatearFechaStr(credito.fechaVencimiento),
      tipoDocumento: 'PG',
      moneda: (credito.moneda && credito.moneda.toUpperCase().includes('DOL')) ? '2' : '1',
      monto: credito.debeActualidad || 0,
      condicion: '',
      email: cliente.usuario?.email || '',
      tipoArchivo: 'XLSX',
      provincia: cliente.provincia || extra.provincia || '',
      concepto: credito.tipoCredito || 'PRESTAMO',
      diasAtraso: credito.diasAtraso || 0,
      calificacionCrediticia: credito.calificacionCrediticia || 'NORMAL'
    };
  }

  exportarExcelDeudas() {
    this.isApplyingFilters.set(true);
    this.creditoService.obtenerCarteraGeneral().subscribe({
      next: (creditos) => {
        const columnas = [
          { key: 'fechaReporte', titulo: 'FECHA DE REPORTE', width: 18 },
          { key: 'codigoEntidad', titulo: 'CODIGO ENTIDAD', width: 18 },
          { key: 'numeroCredito', titulo: 'NUMERO DEL CREDITO', width: 22 },
          { key: 'tipoDocumentoId', titulo: 'TIPO DOCUMENTO ID', width: 18 },
          { key: 'numeroDocumento', titulo: 'NUMERO DOCUMENTO ID', width: 22 },
          { key: 'tipoDeudor', titulo: 'TIPO DE DEUDOR', width: 18 },
          { key: 'nombre', titulo: 'APELLIDOS Y NOMBRES/RAZÓN SOCIAL', width: 40 },
          { key: 'direccion', titulo: 'DIRECCIÓN', width: 40 },
          { key: 'distrito', titulo: 'DISTRITO', width: 20 },
          { key: 'departamento', titulo: 'DEPARTAMENTO', width: 20 },
          { key: 'fechaVencimiento', titulo: 'FECHA DE VENCIMIENTO', width: 22 },
          { key: 'tipoDocumento', titulo: 'TIPO DE DOCUMENTO', width: 20 },
          { key: 'moneda', titulo: 'TIPO DE MONEDA', width: 18 },
          { key: 'monto', titulo: 'MONTO DE LA DEUDA', width: 20 },
          { key: 'condicion', titulo: 'CONDICIÓN DE LA DEUDA', width: 22 },
          { key: 'email', titulo: 'EMAIL DEL DEUDOR', width: 30 },
          { key: 'tipoArchivo', titulo: 'TIPO DE ARCHIVO', width: 18 },
          { key: 'provincia', titulo: 'NOMBRE DE PROVINCIA', width: 22 },
          { key: 'concepto', titulo: 'CONCEPTO DE LA DEUDA', width: 25 }
        ];
        this.generarExcelBase('Reporte_Cartera', 'Cartera General', columnas, creditos, c => this.generarRowDataCredito(c));
      },
      error: (err) => {
        console.error('Error obteniendo datos para Excel', err);
        this.isApplyingFilters.set(false);
      }
    });
  }

  exportarExcelPorCalificacion(calificacion: string) {
    this.isApplyingFilters.set(true);
    this.creditoService.obtenerCarteraPorCalificacion(calificacion).subscribe({
      next: (creditos) => {
        const columnas = [
          { key: 'fechaReporte', titulo: 'FECHA DE REPORTE', width: 18 },
          { key: 'codigoEntidad', titulo: 'CODIGO ENTIDAD', width: 18 },
          { key: 'numeroCredito', titulo: 'NUMERO DEL CREDITO', width: 22 },
          { key: 'tipoDocumentoId', titulo: 'TIPO DOCUMENTO ID', width: 18 },
          { key: 'numeroDocumento', titulo: 'NUMERO DOCUMENTO ID', width: 22 },
          { key: 'tipoDeudor', titulo: 'TIPO DE DEUDOR', width: 18 },
          { key: 'nombre', titulo: 'APELLIDOS Y NOMBRES/RAZÓN SOCIAL', width: 40 },
          { key: 'diasAtraso', titulo: 'DÍAS DE ATRASO', width: 18 },
          { key: 'calificacionCrediticia', titulo: 'CALIFICACIÓN', width: 25 },
          { key: 'direccion', titulo: 'DIRECCIÓN', width: 40 },
          { key: 'distrito', titulo: 'DISTRITO', width: 20 },
          { key: 'departamento', titulo: 'DEPARTAMENTO', width: 20 },
          { key: 'fechaVencimiento', titulo: 'FECHA DE VENCIMIENTO', width: 22 },
          { key: 'capitalVencido', titulo: 'SALDO DEL CAPITAL', width: 22 },
          { key: 'rendimientoDevengado', titulo: 'RENDIMIENTO DEVENGADO', width: 25 },
          { key: 'diasMora', titulo: 'DÍAS DE MORA', width: 18 },
          { key: 'moraPenalidad', titulo: 'MORA/PENALIDAD', width: 20 },
          { key: 'saldoCredito', titulo: 'SALDO DEL CRÉDITO', width: 22 }
        ];
        this.generarExcelBase(`Reporte_${calificacion}`, `Calificación ${calificacion}`, columnas, creditos, c => this.generarRowDataCredito(c));
      },
      error: (err) => {
        console.error(`Error obteniendo datos para Excel ${calificacion}`, err);
        this.isApplyingFilters.set(false);
      }
    });
  }

  exportarExcelNormal() { this.exportarExcelPorCalificacion('NORMAL'); }
  exportarExcelProblemasPotenciales() { this.exportarExcelPorCalificacion('PROBLEMAS_POTENCIALES'); }
  exportarExcelDeficiente() { this.exportarExcelPorCalificacion('DEFICIENTE'); }
  exportarExcelDudoso() { this.exportarExcelPorCalificacion('DUDOSO'); }
  exportarExcelPerdida() { this.exportarExcelPorCalificacion('PERDIDA'); }

  exportarExcelAlDia() {
    this.isApplyingFilters.set(true);
    this.creditoService.obtenerCarteraGeneral().subscribe({
      next: (creditos) => {
        const alDia = creditos.filter(c => c.estado === 'ACTIVO' && (!c.diasAtraso || c.diasAtraso === 0));
        const columnas = [
          { key: 'fechaReporte', titulo: 'FECHA DE REPORTE', width: 18 },
          { key: 'codigoEntidad', titulo: 'CODIGO ENTIDAD', width: 18 },
          { key: 'numeroCredito', titulo: 'NUMERO DEL CREDITO', width: 22 },
          { key: 'tipoDocumentoId', titulo: 'TIPO DOCUMENTO ID', width: 18 },
          { key: 'numeroDocumento', titulo: 'NUMERO DOCUMENTO ID', width: 22 },
          { key: 'tipoDeudor', titulo: 'TIPO DE DEUDOR', width: 18 },
          { key: 'nombre', titulo: 'APELLIDOS Y NOMBRES/RAZÓN SOCIAL', width: 40 },
          { key: 'direccion', titulo: 'DIRECCIÓN', width: 40 },
          { key: 'distrito', titulo: 'DISTRITO', width: 20 },
          { key: 'departamento', titulo: 'DEPARTAMENTO', width: 20 },
          { key: 'fechaVencimiento', titulo: 'FECHA DE VENCIMIENTO', width: 22 },
          { key: 'tipoDocumento', titulo: 'TIPO DE DOCUMENTO', width: 20 },
          { key: 'moneda', titulo: 'TIPO DE MONEDA', width: 18 },
          { key: 'monto', titulo: 'MONTO DE LA DEUDA', width: 20 },
          { key: 'condicion', titulo: 'CONDICIÓN DE LA DEUDA', width: 22 },
          { key: 'email', titulo: 'EMAIL DEL DEUDOR', width: 30 },
          { key: 'provincia', titulo: 'NOMBRE DE PROVINCIA', width: 22 }
        ];
        this.generarExcelBase('Reporte_Al_Dia', 'Al Dia', columnas, alDia, c => this.generarRowDataCredito(c));
      },
      error: (err) => {
        console.error('Error obteniendo datos para Excel', err);
        this.isApplyingFilters.set(false);
      }
    });
  }

  exportarExcelCuotasVencidas() {
    this.isApplyingFilters.set(true);
    this.creditoService.obtenerCarteraGeneral().subscribe({
      next: (creditos) => {
        const cuotasVencidas: any[] = [];
        creditos.forEach(c => {
          if (c.cuotas && c.cuotas.length > 0) {
            c.cuotas.forEach(cuota => {
              if (cuota.estadoCuota === 'MORA' || cuota.estadoCuota === 'PENDIENTE') {
                const hoy = new Date();
                const vencimiento = new Date(cuota.fechaVencimiento);
                if (vencimiento < hoy) {
                   cuotasVencidas.push({ credito: c, cuota: cuota });
                }
              }
            });
          }
        });
        
        const columnas = [
          { key: 'fechaReporte', titulo: 'FECHA DE REPORTE', width: 18 },
          { key: 'numeroCredito', titulo: 'NUMERO DEL CREDITO', width: 22 },
          { key: 'numeroCuota', titulo: 'NÚMERO CUOTA', width: 15 },
          { key: 'nombre', titulo: 'APELLIDOS Y NOMBRES/RAZÓN SOCIAL', width: 40 },
          { key: 'telefono', titulo: 'TELÉFONO', width: 20 },
          { key: 'fechaVencimiento', titulo: 'VENCIMIENTO CUOTA', width: 22 },
          { key: 'montoCuota', titulo: 'MONTO CUOTA', width: 20 },
          { key: 'capital', titulo: 'CAPITAL', width: 18 },
          { key: 'interes', titulo: 'INTERÉS', width: 18 },
          { key: 'mora', titulo: 'MORA', width: 15 },
          { key: 'moneda', titulo: 'TIPO DE MONEDA', width: 18 },
          { key: 'condicion', titulo: 'CONDICIÓN', width: 22 }
        ];

        this.generarExcelBase('Reporte_Cuotas_Vencidas', 'Cuotas Vencidas', columnas, cuotasVencidas, (item: any) => {
          const credito = item.credito;
          const cuota = item.cuota;
          const cliente = credito.cliente || {} as any;
          const extra = this.extraerExtra(cliente);
          const nombreFormateado = this.formatearNombreCliente(cliente, credito, extra);
          
          return {
            fechaReporte: this.formatearFechaStr(new Date()),
            numeroCredito: credito.id?.toString(),
            numeroCuota: cuota.numeroCuota,
            nombre: nombreFormateado,
            telefono: cliente.telefono || cliente.celular || extra.telefono || '',
            fechaVencimiento: this.formatearFechaStr(cuota.fechaVencimiento),
            montoCuota: cuota.totalCuota || 0,
            capital: cuota.capital || 0,
            interes: cuota.interes || 0,
            mora: cuota.interesMora || 0,
            moneda: (credito.moneda && credito.moneda.toUpperCase().includes('DOL')) ? '2' : '1',
            condicion: 'MORA'
          };
        });
      },
      error: (err) => {
        console.error('Error obteniendo datos para Excel', err);
        this.isApplyingFilters.set(false);
      }
    });
  }

  toggleFullscreen() {
    this.isFullscreen.update(v => !v);
    const wrapper = document.querySelector('.dashboard-wrapper');
    if (wrapper) {
      if (this.isFullscreen()) {
        wrapper.classList.add('reportes-fullscreen-mode');
      } else {
        wrapper.classList.remove('reportes-fullscreen-mode');
      }
    }
  }

  ngOnDestroy() {
    const wrapper = document.querySelector('.dashboard-wrapper');
    if (wrapper) {
      wrapper.classList.remove('reportes-fullscreen-mode');
    }
  }
}
