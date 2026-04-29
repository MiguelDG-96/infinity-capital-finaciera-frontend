import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Credito } from '../../../../core/models/credito.model';
import { CreditoService } from '../../../../core/services/credito.service';
import { UpdateCreditoRequestDTO } from '../../../../core/models/credito.dto';

@Component({
  selector: 'app-edit-credito-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="modal modal-open">
      <div class="modal-box bg-base-100 max-w-md border border-base-content/10 shadow-2xl rounded-3xl">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-black text-xl flex items-center gap-2">
            <lucide-icon name="edit-2" class="text-primary w-6 h-6"></lucide-icon>
            Editar Crédito #{{ credito.id }}
          </h3>
          <button class="btn btn-ghost btn-sm btn-circle" (click)="cerrar.emit()">
            <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
          </button>
        </div>

        <form (ngSubmit)="guardar()" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-50">Monto Aprobado</span></label>
              <input type="number" [(ngModel)]="editReq.montoAprobado" name="montoAprobado" class="input input-bordered w-full rounded-2xl" step="0.01">
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-50">Tasa (TEM %)</span></label>
              <input type="number" [(ngModel)]="editReq.tem" name="tem" class="input input-bordered w-full rounded-2xl" step="0.01">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-50">Plazo (Meses)</span></label>
              <input type="number" [(ngModel)]="editReq.plazoMeses" name="plazoMeses" class="input input-bordered w-full rounded-2xl">
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-50">Estado Crédito</span></label>
              <select [(ngModel)]="editReq.estado" name="estado" class="select select-bordered w-full rounded-2xl">
                <option value="SOLICITADO">SOLICITADO</option>
                <option value="EN_EVALUACION">EN EVALUACION</option>
                <option value="APROBADO">APROBADO</option>
                <option value="RECHAZADO">RECHAZADO</option>
                <option value="ACTIVO">ACTIVO</option>
                <option value="PAGADO">PAGADO</option>
                <option value="ATRASADO">ATRASADO</option>
                <option value="MORA">MORA</option>
                <option value="RESUELTO">RESUELTO</option>
              </select>
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-50">Observación Evaluador</span></label>
            <textarea [(ngModel)]="editReq.observacionEvaluador" name="observacionEvaluador" class="textarea textarea-bordered w-full rounded-2xl" rows="3"></textarea>
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
export class EditCreditoModalComponent implements OnInit {
  @Input() credito!: Credito;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardadoExitoso = new EventEmitter<void>();

  private creditoService = inject(CreditoService);
  
  editReq: UpdateCreditoRequestDTO = {};
  cargando = false;

  ngOnInit() {
    this.editReq = {
      montoAprobado: this.credito.montoAprobado || this.credito.montoCredito,
      tem: this.credito.tem || this.credito.tasaAprobada,
      plazoMeses: this.credito.plazoMeses,
      estado: this.credito.estado,
      observacionEvaluador: this.credito.observacionEvaluador
    };
  }

  guardar() {
    this.cargando = true;
    this.creditoService.actualizarCredito(this.credito.id, this.editReq).subscribe({
      next: (resp) => {
        this.cargando = false;
        alert(resp.mensaje);
        this.guardadoExitoso.emit();
      },
      error: (err) => {
        this.cargando = false;
        alert(err.error?.mensaje || 'Error al actualizar el crédito');
      }
    });
  }
}
