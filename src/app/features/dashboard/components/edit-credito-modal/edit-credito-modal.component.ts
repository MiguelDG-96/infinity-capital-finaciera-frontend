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
  templateUrl: './edit-credito-modal.component.html',
})
export class EditCreditoModalComponent implements OnInit {
  @Input() credito!: Credito;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardadoExitoso = new EventEmitter<void>();

  private creditoService = inject(CreditoService);
  
  editReq: UpdateCreditoRequestDTO = {};
  cargando = false;
  showConfirmModal = false;

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

  regenerar() {
    this.showConfirmModal = true;
  }

  confirmarRegenerar() {
    this.cargando = true;
    this.creditoService.regenerarCronograma(this.credito.id).subscribe({
      next: (resp) => {
        this.cargando = false;
        this.showConfirmModal = false;
        alert(resp.mensaje);
        this.guardadoExitoso.emit();
      },
      error: (err) => {
        this.cargando = false;
        this.showConfirmModal = false;
        alert(err.error?.mensaje || 'Error al regenerar el cronograma');
      }
    });
  }
}
