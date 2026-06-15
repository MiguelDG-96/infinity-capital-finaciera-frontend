import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Credito } from '../../../../core/models/credito.model';
import { CreditoService } from '../../../../core/services/credito.service';

@Component({
  selector: 'app-pago-global-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './pago-global-modal.component.html'
})
export class PagoGlobalModalComponent implements OnInit {
  @Input() credito!: Credito;
  @Output() cerrar = new EventEmitter<void>();
  @Output() pagoExitoso = new EventEmitter<any>();

  pagoForm!: FormGroup;
  enviando = signal(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private creditoService: CreditoService
  ) {}

  ngOnInit(): void {
    this.pagoForm = this.fb.group({
      monto: ['', [Validators.required, Validators.min(1)]],
      metodoPago: ['EFECTIVO', Validators.required],
      numeroComprobante: ['']
    });

    this.pagoForm.get('metodoPago')?.valueChanges.subscribe(val => {
      if (val === 'EFECTIVO') {
         this.pagoForm.get('numeroComprobante')?.clearValidators();
      } else {
         this.pagoForm.get('numeroComprobante')?.setValidators([Validators.required]);
      }
      this.pagoForm.get('numeroComprobante')?.updateValueAndValidity();
    });
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

    this.creditoService.registrarPagoGlobal(this.credito.id, monto, metodoPago, numeroComprobante).subscribe({
      next: (resp) => {
        this.enviando.set(false);
        this.pagoExitoso.emit(resp);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err.error?.error || 'Error al procesar el abono global');
      }
    });
  }
}
