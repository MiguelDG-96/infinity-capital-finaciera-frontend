import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Credito } from '../../../../core/models/credito.model';
import { CreditoService } from '../../../../core/services/credito.service';

@Component({
  selector: 'app-pago-anticipado-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './pago-anticipado-modal.component.html'
})
export class PagoAnticipadoModalComponent implements OnInit {
  @Input() credito!: Credito;
  @Output() cerrar = new EventEmitter<void>();
  @Output() pagoExitoso = new EventEmitter<void>();

  pagoForm!: FormGroup;
  enviando = signal(false);
  error = signal<string | null>(null);
  exito = signal(false);

  tipoPago = signal<'TOTAL' | 'PARCIAL'>('TOTAL');

  constructor(
    private fb: FormBuilder,
    private creditoService: CreditoService
  ) {}

  ngOnInit(): void {
    const saldo = this.credito.debeActualidad;
    this.pagoForm = this.fb.group({
      monto: [saldo, [Validators.required, Validators.min(1), Validators.max(saldo)]],
      metodoPago: ['SALDO_BILLETERA', Validators.required],
      numeroComprobante: ['']
    });

    // Cambiar monto al alternar tipo de pago
    this.pagoForm.get('monto')?.valueChanges.subscribe(val => {
      if (val === this.credito.debeActualidad) {
        this.tipoPago.set('TOTAL');
      } else {
        this.tipoPago.set('PARCIAL');
      }
    });
  }

  seleccionarPagoTotal(): void {
    this.pagoForm.patchValue({ monto: this.credito.debeActualidad });
  }

  isFieldInvalid(field: string): boolean {
    const f = this.pagoForm.get(field);
    return !!f && f.invalid && (f.dirty || f.touched);
  }

  confirmarPago(): void {
    if (this.pagoForm.invalid) {
      this.pagoForm.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const { monto, metodoPago, numeroComprobante } = this.pagoForm.value;

    this.creditoService.pagoAnticipado(this.credito.id, monto, metodoPago, numeroComprobante).subscribe({
      next: () => {
        this.exito.set(true);
        this.enviando.set(false);
        setTimeout(() => {
          this.pagoExitoso.emit();
        }, 2000);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err.error?.mensaje || 'Error al procesar el pago anticipado');
      }
    });
  }
}
