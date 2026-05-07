import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ThemeService } from '../../../../core/services/theme.service';
import { LucideAngularModule } from 'lucide-angular';
import { ReporteService } from '../../../../core/services/reporte.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule, LucideAngularModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  themeService = inject(ThemeService);
  reporteService = inject(ReporteService);

  selectedYear = '2026';
  selectedMonth = 'todos';
  selectedBranch = 'todas';
  isApplyingFilters = signal(false);

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

        // 3. Semaforo Clientes
        this.semaforoData = {
          ...this.semaforoData,
          datasets: [{
            ...this.semaforoData.datasets[0],
            data: [
              data.clientesSemaforoVerde,
              data.clientesSemaforoGris,
              data.clientesSemaforoAmarillo,
              data.clientesSemaforoRojo,
              data.clientesSemaforoNegro
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
    datasets: [{ data: [], label: 'Ganancia', backgroundColor: '#10b981', borderRadius: 4 }]
  };

  // 1.5 Ganancia Anual
  public gananciaAnualOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: true, text: 'Ganancia Anual', color: this.titleColor() } },
    scales: { y: { ticks: { color: this.textColor(), callback: (v) => this.formatMoney(v) }, grid: { color: this.gridColor() } }, x: { ticks: { color: this.textColor() }, grid: { display: false } } }
  }));
  public gananciaAnualData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Ganancia', backgroundColor: '#3b82f6', borderRadius: 4 }]
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
      { data: [], label: 'Capital Cancelado', backgroundColor: '#6366f1', borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 } },
      { data: [], label: 'Intereses Cancelados', backgroundColor: '#f59e0b', borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 } }
    ]
  };

  // 3. Semaforo
  public semaforoOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { color: this.textColor() } }, title: { display: true, text: 'Clasificación de Clientes (Semáforo)', color: this.titleColor() } }
  }));
  public semaforoData: ChartData<'doughnut'> = {
    labels: ['Verde (Sin deudas)', 'Gris (No registra)', 'Amarillo (Poco atraso)', 'Rojo (Atraso signif.)', 'Negro (Judicial/Pérdida)'],
    datasets: [{
      data: [],
      backgroundColor: ['#10b981', '#94a3b8', '#facc15', '#ef4444', '#111827'],
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
      { data: [], label: 'A Recibir (Proyectado)', borderColor: '#94a3b8', borderDash: [5, 5], backgroundColor: 'transparent', tension: 0.3 },
      { data: [], label: 'Recibido (Real)', borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, tension: 0.3 }
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
      { data: [], label: 'Ganancias', borderColor: '#10b981', backgroundColor: 'transparent', tension: 0.3 },
      { data: [], label: 'Pérdidas', borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.2)', fill: true, tension: 0.3 }
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
}
