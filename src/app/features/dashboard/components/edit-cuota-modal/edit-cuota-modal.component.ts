import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Cuota, Credito } from '../../../../core/models/credito.model';
import { CreditoService } from '../../../../core/services/credito.service';
import { UpdateCuotaRequestDTO } from '../../../../core/models/credito.dto';

@Component({
  selector: 'app-edit-cuota-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './edit-cuota-modal.component.html',
  styles: []
})
export class EditCuotaModalComponent implements OnInit {
  @Input() cuota!: Cuota;
  @Input() credito!: Credito;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardadoExitoso = new EventEmitter<void>();

  private creditoService = inject(CreditoService);
  
  editReq: UpdateCuotaRequestDTO = {};
  cargando = false;
  penalidadSugerida = 0;
  showConfirmModal = false;

  ngOnInit() {
    // Inicializar con los valores actuales
    this.editReq = {
      fechaVencimiento: this.formatDate(this.cuota.fechaVencimiento),
      capital: this.cuota.capital,
      interes: this.cuota.interes,
      comision: this.cuota.comision,
      seguro: this.cuota.seguro,
      estadoCuota: this.cuota.estadoCuota,
      interesMora: this.cuota.interesMora || 0,
      penalidad: this.cuota.penalidad || 0
    };
    this.calcularSugerencia();
  }

  calcularSugerencia() {
    if (!this.credito || !this.credito.cuotas) return;
    
    // Sumar capital de todas las cuotas vencidas (estado PENDIENTE o PAGADO_PARCIAL y fecha vencida)
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    
    let capitalVencido = 0;
    for (const c of this.credito.cuotas) {
      if (c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'PAGADO_PARCIAL') {
        const fechaVenc = new Date(c.fechaVencimiento);
        fechaVenc.setHours(0,0,0,0);
        
        // El usuario quiere incluir solo las vencidas.
        // Si usamos la fecha del componente, podríamos estar editando una cuota actual.
        // Simulamos la sugerencia basados en la fecha del sistema o del Vencimiento actual.
        if (fechaVenc < hoy) {
          capitalVencido += (c.capital || 0);
        }
      }
    }
    
    // Si la cuota actual está vencida y no se sumó porque le cambiaron el estado manualmente:
    const dVenc = new Date(this.cuota.fechaVencimiento);
    dVenc.setHours(0,0,0,0);
    if (dVenc < hoy && this.cuota.estadoCuota !== 'PENDIENTE' && this.cuota.estadoCuota !== 'PAGADO_PARCIAL') {
       capitalVencido += (this.cuota.capital || 0);
    }
    
    this.penalidadSugerida = capitalVencido * 0.06;
  }

  usarPenalidadSugerida() {
    this.editReq.penalidad = Number(this.penalidadSugerida.toFixed(2));
    this.editReq.estadoCuota = 'MORA';
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  abrirConfirmacion() {
    this.showConfirmModal = true;
  }

  getIconName(): string {
    switch (this.editReq.estadoCuota) {
      case 'PAGADO': return 'check-circle';
      case 'MORA': return 'alert-triangle';
      case 'POSTERGADA': return 'clock';
      case 'PENDIENTE': return 'calendar';
      case 'PAGADO_PARCIAL': return 'pie-chart';
      default: return 'help-circle';
    }
  }

  getMensajeEstado(): string {
    switch (this.editReq.estadoCuota) {
      case 'PAGADO': return 'Vas a marcar la cuota como PAGADA. Esta acción confirmará el pago y afectará el cronograma.';
      case 'MORA': return 'Vas a marcar la cuota en MORA. Se aplicarán las penalidades correspondientes.';
      case 'POSTERGADA': return 'Vas a POSTERGAR esta cuota. Se modificará su fecha de exigibilidad.';
      case 'PENDIENTE': return 'Vas a marcar la cuota como PENDIENTE de pago.';
      case 'PAGADO_PARCIAL': return 'Vas a marcar la cuota con PAGO PARCIAL. El saldo restante seguirá siendo exigible.';
      default: return '¿Confirmas guardar los cambios en esta cuota?';
    }
  }

  confirmarGuardar() {
    this.cargando = true;
    this.creditoService.actualizarCuota(this.cuota.id, this.editReq).subscribe({
      next: (resp) => {
        this.cargando = false;
        this.showConfirmModal = false;
        alert(resp.mensaje);
        this.guardadoExitoso.emit();
      },
      error: (err) => {
        this.cargando = false;
        this.showConfirmModal = false;
        alert(err.error?.mensaje || 'Error al actualizar la cuota');
      }
    });
  }
}
