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
  template: `
    <div class="modal modal-open">
      <div class="modal-box bg-base-100 max-w-md border border-base-content/10 shadow-2xl rounded-3xl">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-black text-xl flex items-center gap-2">
            <lucide-icon name="edit-3" class="text-primary w-6 h-6"></lucide-icon>
            Editar Cuota #{{ cuota.numeroCuota }}
          </h3>
          <button class="btn btn-ghost btn-sm btn-circle" (click)="cerrar.emit()">
            <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
          </button>
        </div>

        <form (ngSubmit)="guardar()" class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-50">Fecha de Vencimiento</span></label>
            <input type="date" [(ngModel)]="editReq.fechaVencimiento" name="fechaVencimiento" class="input input-bordered w-full rounded-2xl" required>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-50">Capital</span></label>
              <input type="number" [(ngModel)]="editReq.capital" name="capital" class="input input-bordered w-full rounded-2xl" step="0.01">
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-50">Interés</span></label>
              <input type="number" [(ngModel)]="editReq.interes" name="interes" class="input input-bordered w-full rounded-2xl" step="0.01">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-50">Comisión</span></label>
              <input type="number" [(ngModel)]="editReq.comision" name="comision" class="input input-bordered w-full rounded-2xl" step="0.01">
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-50">Seguro</span></label>
              <input type="number" [(ngModel)]="editReq.seguro" name="seguro" class="input input-bordered w-full rounded-2xl" step="0.01">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 bg-error/5 p-3 rounded-2xl border border-error/10">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase text-error/80">Mora Diaria</span></label>
              <input type="number" [(ngModel)]="editReq.interesMora" name="interesMora" class="input input-bordered input-error w-full rounded-2xl" step="0.01">
            </div>
            <div class="form-control">
              <label class="label flex justify-between">
                <span class="label-text font-bold text-[10px] uppercase text-error/80">Penalidad Fija</span>
                <button type="button" class="text-[9px] text-primary hover:underline font-bold" (click)="usarPenalidadSugerida()" *ngIf="penalidadSugerida > 0">Sugerido: {{ penalidadSugerida | currency:'S/ ' }}</button>
              </label>
              <input type="number" [(ngModel)]="editReq.penalidad" name="penalidad" class="input input-bordered input-error w-full rounded-2xl" step="0.01">
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-50">Estado de Cuota</span></label>
            <select [(ngModel)]="editReq.estadoCuota" name="estadoCuota" class="select select-bordered w-full rounded-2xl">
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="PAGADO">PAGADO</option>
              <option value="MORA">MORA</option>
              <option value="PAGADO_PARCIAL">PAGADO PARCIAL</option>
              <option value="POSTERGADA">POSTERGADA</option>
            </select>
          </div>

          <div class="modal-action pt-4">
            <button type="button" class="btn btn-ghost rounded-2xl" (click)="cerrar.emit()">Cancelar</button>
            <button type="submit" class="btn btn-primary px-8 rounded-2xl shadow-lg shadow-primary/20" [disabled]="cargando">
              <span *ngIf="cargando" class="loading loading-spinner loading-xs"></span>
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
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
      if ((c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'PAGADO_PARCIAL') && c.estadoCuota !== 'POSTERGADA') {
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

  guardar() {
    this.cargando = true;
    this.creditoService.actualizarCuota(this.cuota.id, this.editReq).subscribe({
      next: (resp) => {
        this.cargando = false;
        alert(resp.mensaje);
        this.guardadoExitoso.emit();
      },
      error: (err) => {
        this.cargando = false;
        alert(err.error?.mensaje || 'Error al actualizar la cuota');
      }
    });
  }
}
