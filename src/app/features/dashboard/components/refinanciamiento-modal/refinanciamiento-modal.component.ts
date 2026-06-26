import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreditoService } from '../../../../core/services/credito.service';

@Component({
  selector: 'app-refinanciamiento-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './refinanciamiento-modal.component.html',
  styleUrls: ['./refinanciamiento-modal.component.css']
})
export class RefinanciamientoModalComponent {
  @Input() set creditoId(id: number | undefined) {
    if (id) {
      this._creditoId = id;
      this.cargarResumen(id);
    }
  }
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<number>(); // Emits the new credit ID

  private creditoService = inject(CreditoService);
  private _creditoId!: number;

  procesando = signal<boolean>(false);
  cargandoResumen = signal<boolean>(false);
  error = signal<string | null>(null);

  resumen = signal<{
    capitalPendiente: number;
    interesesVencidos: number;
    moraTotal: number;
    deudaTotalAProrratear: number;
  } | null>(null);

  // Formulario
  nuevaTasa = signal<number>(10); // Valor por defecto
  nuevoNumeroCuotas = signal<number>(12); // Valor por defecto
  cuotaDeseada = signal<number | null>(null);

  // Calculadora
  proyeccionCuotaBase = computed(() => {
    const res = this.resumen();
    if (!res || !this.nuevaTasa() || !this.nuevoNumeroCuotas()) return 0;
    const capital = res.capitalPendiente;
    const tem = this.nuevaTasa() / 100;
    const cuotas = this.nuevoNumeroCuotas();
    if (tem === 0) return capital / cuotas;
    const factor = (tem * Math.pow(1 + tem, cuotas)) / (Math.pow(1 + tem, cuotas) - 1);
    return capital * factor;
  });

  proyeccionCargo = computed(() => {
    const res = this.resumen();
    if (!res || !this.nuevoNumeroCuotas()) return 0;
    return res.deudaTotalAProrratear / this.nuevoNumeroCuotas();
  });

  cuotaFinalEstimada = computed(() => {
    return this.proyeccionCuotaBase() + this.proyeccionCargo();
  });

  cargarResumen(id: number) {
    this.cargandoResumen.set(true);
    this.error.set(null);
    this.creditoService.obtenerResumenRefinanciamiento(id).subscribe({
      next: (res) => {
        this.resumen.set(res);
        this.cargandoResumen.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al obtener resumen de refinanciamiento.');
        this.cargandoResumen.set(false);
      }
    });
  }

  // Lógica para que cuando ingrese la cuota deseada, calcule el número de cuotas sugerido
  calcularCuotasPorCuotaDeseada() {
    const deseada = this.cuotaDeseada();
    const res = this.resumen();
    const tasa = this.nuevaTasa();
    
    if (!deseada || !res || !tasa || deseada <= 0) return;
    
    // Queremos encontrar 'n' tal que:
    // CuotaDeseada = [Capital * tem * (1+tem)^n / ((1+tem)^n - 1)] + [DeudaAProrratear / n]
    // Esta ecuación no tiene despeje analítico sencillo para 'n', por lo que haremos una iteración simple.
    
    let nEncontrado = 0;
    let mejorDiferencia = Infinity;
    const MAX_CUOTAS = 60; // Límite razonable

    for (let n = 1; n <= MAX_CUOTAS; n++) {
      const tem = tasa / 100;
      let cuotaBase = 0;
      if (tem === 0) {
        cuotaBase = res.capitalPendiente / n;
      } else {
        const factor = (tem * Math.pow(1 + tem, n)) / (Math.pow(1 + tem, n) - 1);
        cuotaBase = res.capitalPendiente * factor;
      }
      const prorrateo = res.deudaTotalAProrratear / n;
      const cuotaCalculada = cuotaBase + prorrateo;
      
      const diff = Math.abs(cuotaCalculada - deseada);
      
      // Si la cuota calculada baja del monto deseado o es la más cercana
      if (diff < mejorDiferencia) {
        mejorDiferencia = diff;
        nEncontrado = n;
      }
      
      // Si la cuota calculada es menor o igual al monto deseado, nos detenemos
      if (cuotaCalculada <= deseada) {
        nEncontrado = n;
        break;
      }
    }
    
    if (nEncontrado > 0) {
      this.nuevoNumeroCuotas.set(nEncontrado);
    }
  }

  showConfirmModal = signal<boolean>(false);

  abrirConfirmacion() {
    if (!this.resumen()) return;
    if (this.nuevaTasa() <= 0 || this.nuevoNumeroCuotas() <= 0) {
      this.error.set('La tasa y el número de cuotas deben ser mayores a cero.');
      return;
    }
    this.showConfirmModal.set(true);
  }

  confirmar() {
    this.showConfirmModal.set(false);
    this.procesando.set(true);
    this.error.set(null);
    this.creditoService.refinanciarCredito(this._creditoId, {
        nuevaTasa: this.nuevaTasa(),
        nuevoNumeroCuotas: this.nuevoNumeroCuotas()
      }).subscribe({
        next: (resp) => {
          this.procesando.set(false);
          this.saved.emit(resp.nuevoCreditoId);
        },
        error: (err) => {
          this.procesando.set(false);
          this.error.set(err.error?.error || 'Error al refinanciar el crédito.');
        }
      });
  }

  onClose() {
    this.close.emit();
  }
}
