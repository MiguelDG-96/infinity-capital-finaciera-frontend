import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ThemeService } from '../../../../core/services/theme.service';
import { LucideAngularModule } from 'lucide-angular';
import { ReporteService } from '../../../../core/services/reporte.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  // Filtros
  selectedYear = '2026';
  selectedMonth = 'todos';
  selectedBranch = 'todas';
  isApplyingFilters = signal(false);

  // Colores dinámicos basados en el tema
  textColor = computed(() => this.themeService.darkMode() ? '#e2e8f0' : '#334155');
  titleColor = computed(() => this.themeService.darkMode() ? '#ffffff' : '#0f172a');
  gridColor = computed(() => this.themeService.darkMode() ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)');

  ngOnInit() {
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    this.isApplyingFilters.set(true);
    
    this.reporteService.getDashboardData(this.selectedYear, this.selectedMonth, this.selectedBranch).subscribe({
      next: (data) => {
        this.barChartData = {
          ...this.barChartData,
          datasets: [
            { ...this.barChartData.datasets[0], data: data.prestamosAprobados },
            { ...this.barChartData.datasets[1], data: data.prestamosRechazados }
          ]
        };

        this.pieChartData = {
          ...this.pieChartData,
          datasets: [
            { ...this.pieChartData.datasets[0], data: data.estadoCartera }
          ]
        };

        this.lineChartData = {
          ...this.lineChartData,
          datasets: [
            { ...this.lineChartData.datasets[0], data: data.clientesActivos }
          ]
        };

        this.multiAxisLineChartData = {
          ...this.multiAxisLineChartData,
          datasets: [
            { ...this.multiAxisLineChartData.datasets[0], data: data.recuperacion },
            { ...this.multiAxisLineChartData.datasets[1], data: data.desembolsos }
          ]
        };

        this.doughnutChartData = {
          ...this.doughnutChartData,
          datasets: [
            { ...this.doughnutChartData.datasets[0], data: data.tiposCredito }
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

  exportarPdf() {
    this.isApplyingFilters.set(true);
    
    // En lugar de usar html2canvas (que falla con los colores modernos oklch de Tailwind),
    // extraeremos directamente las imágenes de los <canvas> que genera Chart.js.
    const canvases = document.querySelectorAll('#pdf-content canvas') as NodeListOf<HTMLCanvasElement>;
    
    if (canvases.length >= 5) {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const isDark = this.themeService.darkMode();

        // Si es modo oscuro, pintar el fondo del PDF de oscuro para que el texto blanco de las gráficas se vea
        if (isDark) {
          pdf.setFillColor(17, 24, 39); // Tailwind gray-900
          pdf.rect(0, 0, 210, 297, 'F');
        }
        
        // Cabecera del Documento
        pdf.setFontSize(16);
        pdf.setTextColor(isDark ? 243 : 40, isDark ? 244 : 40, isDark ? 246 : 40);
        pdf.text('Reporte Financiero - Infinity Capital', 14, 15);
        
        pdf.setFontSize(10);
        pdf.setTextColor(isDark ? 156 : 100, isDark ? 163 : 100, isDark ? 175 : 100);
        pdf.text(`Año Fiscal: ${this.selectedYear}  |  Mes: ${this.selectedMonth}  |  Sucursal: ${this.selectedBranch}`, 14, 22);

        // Convertir cada Canvas a imagen PNG
        const imgBar = canvases[0].toDataURL('image/png', 1.0);
        const imgLine = canvases[1].toDataURL('image/png', 1.0);
        const imgMulti = canvases[2].toDataURL('image/png', 1.0);
        const imgPie = canvases[3].toDataURL('image/png', 1.0);
        const imgDoughnut = canvases[4].toDataURL('image/png', 1.0);

        // Dibujar en el PDF con un layout organizado manualmente (x, y, ancho, alto)
        // Fila 1: Bar & Line (Mitad y mitad)
        pdf.addImage(imgBar, 'PNG', 10, 30, 90, 65);
        pdf.addImage(imgLine, 'PNG', 110, 30, 90, 65);

        // Fila 2: Multi-Axis (Ancho completo)
        pdf.addImage(imgMulti, 'PNG', 10, 105, 190, 80);

        // Fila 3: Pie & Doughnut
        pdf.addImage(imgPie, 'PNG', 20, 195, 75, 75);
        pdf.addImage(imgDoughnut, 'PNG', 115, 195, 75, 75);
        
        // Descargar PDF
        pdf.save(`Dashboard_Financiero_${this.selectedYear}.pdf`);
      } catch (err) {
        console.error('Error generando PDF', err);
      }
    } else {
      console.error('No se encontraron todos los gráficos para exportar.');
    }
    this.isApplyingFilters.set(false);
  }

  // 1. Bar Chart
  public barChartOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { color: this.textColor() } },
      title: { display: true, text: 'Préstamos Otorgados por Mes', color: this.titleColor() },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) { label += ': '; }
            if (context.parsed.y !== null) { label += 'S/ ' + context.parsed.y.toLocaleString('es-PE'); }
            return label;
          }
        }
      }
    },
    scales: {
      y: { 
        ticks: { 
          color: this.textColor(),
          callback: function(value) { return 'S/ ' + value.toLocaleString('es-PE'); }
        }, 
        grid: { color: this.gridColor() } 
      },
      x: { ticks: { color: this.textColor() }, grid: { display: false } }
    }
  }));
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      { data: [65000, 59000, 80000, 81000, 56000, 55000], label: 'Aprobados (S/)', backgroundColor: 'rgba(56, 189, 248, 0.8)' },
      { data: [28000, 48000, 40000, 19000, 86000, 27000], label: 'Rechazados (S/)', backgroundColor: 'rgba(244, 63, 94, 0.8)' }
    ]
  };

  // 2. Pie Chart
  public pieChartOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: this.textColor() } },
      title: { display: true, text: 'Estado de la Cartera', color: this.titleColor() }
    }
  }));
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: ['Al Día', 'En Mora (1-30 días)', 'Vencidos', 'En Proceso'],
    datasets: [{
      data: [300, 50, 20, 80],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'],
      borderWidth: 0
    }]
  };

  // 3. Line Chart
  public lineChartOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: this.textColor() } },
      title: { display: true, text: 'Crecimiento de Clientes', color: this.titleColor() }
    },
    scales: {
      y: { ticks: { color: this.textColor() }, grid: { color: this.gridColor() } },
      x: { ticks: { color: this.textColor() }, grid: { display: false } }
    }
  }));
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartData<'line'> = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        data: [120, 150, 180, 220, 260, 310],
        label: 'Clientes Activos',
        fill: true,
        tension: 0.4,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)'
      }
    ]
  };

  // 4. Multi-Axis Line Chart
  public multiAxisLineChartOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: this.textColor() } },
      title: { display: true, text: 'Flujo de Caja: Desembolsos vs Recuperación', color: this.titleColor() },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) { label += ': '; }
            if (context.parsed.y !== null) { label += 'S/ ' + context.parsed.y.toLocaleString('es-PE'); }
            return label;
          }
        }
      }
    },
    scales: {
      x: { ticks: { color: this.textColor() }, grid: { display: false } },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: { 
          color: '#10b981',
          callback: function(value) { return 'S/ ' + value.toLocaleString('es-PE'); }
        },
        grid: { color: this.gridColor() }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: { 
          color: '#f43f5e',
          callback: function(value) { return 'S/ ' + value.toLocaleString('es-PE'); }
        },
        grid: { drawOnChartArea: false }
      }
    }
  }));
  public multiAxisLineChartType: ChartType = 'line';
  public multiAxisLineChartData: ChartData<'line'> = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        data: [50000, 60000, 55000, 70000, 75000, 80000],
        label: 'Recuperado (S/)',
        yAxisID: 'y',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.3,
        fill: true
      },
      {
        data: [65000, 59000, 80000, 81000, 56000, 55000],
        label: 'Desembolsado (S/)',
        yAxisID: 'y1',
        borderColor: '#f43f5e',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.3
      }
    ]
  };

  // 5. Doughnut Chart
  public doughnutChartOptions = computed<ChartConfiguration['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: this.textColor() } },
      title: { display: true, text: 'Distribución por Tipo de Crédito', color: this.titleColor() }
    }
  }));
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Préstamo Personal', 'Microcrédito Negocio', 'Crédito Vehicular', 'Hipotecario'],
    datasets: [
      {
        data: [45, 30, 15, 10],
        backgroundColor: ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b'],
        borderWidth: 0
      }
    ]
  };
}
