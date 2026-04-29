// src/app/features/dashboard/pages/billetera/billetera.component.ts

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BilleteraService } from '../../../../core/services/billetera.service';
import { 
  CuentaVirtual, 
  TransaccionVirtual, 
  CuentaBancaria 
} from '../../../../core/models/billetera.model';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-billetera',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule, FormsModule],
  templateUrl: './billetera.component.html',
  styleUrl: './billetera.component.css'
})
export class BilleteraComponent implements OnInit {
  private billeteraService = inject(BilleteraService);
  private fb = inject(FormBuilder);

  saldo = signal<CuentaVirtual | null>(null);
  transacciones = signal<TransaccionVirtual[]>([]);
  cuentasBancarias = signal<CuentaBancaria[]>([]);
  cargando = signal<boolean>(true);

  mostrarModalRetiro = signal<boolean>(false);
  mostrarModalNuevaCuenta = signal<boolean>(false);
  mostrarFormNuevaCuentaEnRetiro = signal<boolean>(false);

  cuentaForm = this.fb.group({
    banco: ['', Validators.required],
    numeroCuenta: ['', Validators.required],
    cci: [''],
    tipoCuenta: ['AHORROS', Validators.required],
    codigoVerificacion: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  retiroForm = this.fb.group({
    monto: [0, [Validators.required, Validators.min(1)]],
    cuentaBancariaId: [null, Validators.required],
    codigoVerificacion: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  // OTP State
  otpEnviado = signal<{ [key: string]: boolean }>({});
  cooldown = signal<{ [key: string]: number }>({});
  errorOtp = signal<string | null>(null);

  // Elimination state
  cuentaAEliminar = signal<number | null>(null);
  mostrarModalEliminar = signal<boolean>(false);
  otpEliminar = signal<string>('');
  
  // Custom Notification System (Liquid Glass)
  notificacion = signal<{
    mostrar: boolean,
    tipo: 'success' | 'error',
    titulo: string,
    mensaje: string
  } | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);
    
    // Cargar Saldo
    this.billeteraService.obtenerMiSaldo().subscribe(s => this.saldo.set(s));
    
    // Cargar Transacciones
    this.billeteraService.listarTransacciones().subscribe(t => this.transacciones.set(t));
    
    // Cargar Cuentas
    this.billeteraService.listarCuentasBancarias().subscribe(c => {
        this.cuentasBancarias.set(c);
        this.cargando.set(false);
    });
  }

  solicitarOtp(accion: string) {
    if (this.cooldown()[accion] > 0) return;

    this.billeteraService.solicitarOtp(accion).subscribe({
      next: () => {
        this.otpEnviado.update(v => ({ ...v, [accion]: true }));
        this.iniciarCooldown(accion);
        this.errorOtp.set(null);
      },
      error: (err) => this.errorOtp.set(err.error?.error || 'Error al enviar el código')
    });
  }

  private iniciarCooldown(accion: string) {
    this.cooldown.update(v => ({ ...v, [accion]: 60 }));
    const interval = setInterval(() => {
      this.cooldown.update(v => {
        const newVal = v[accion] - 1;
        if (newVal <= 0) {
          clearInterval(interval);
        }
        return { ...v, [accion]: newVal };
      });
    }, 1000);
  }

  agregarCuenta() {
    if (this.cuentaForm.valid) {
      this.billeteraService.agregarCuentaBancaria(this.cuentaForm.value as any).subscribe({
        next: (nuevaCuenta) => {
            this.mostrarModalNuevaCuenta.set(false);
            
            // Si viene desde el flujo de retiro, seleccionar la nueva cuenta automáticamente
            if (this.mostrarFormNuevaCuentaEnRetiro()) {
              this.retiroForm.patchValue({ cuentaBancariaId: nuevaCuenta.id as any });
              this.mostrarFormNuevaCuentaEnRetiro.set(false);
            }

            this.cuentaForm.reset({ tipoCuenta: 'AHORROS' });
            this.otpEnviado.update(v => ({ ...v, ['WALLET_ADD_ACCOUNT']: false }));
            this.cargarDatos();
            this.lanzarNotificacion('success', 'Cuenta Registrada', 'Tu cuenta bancaria ha sido agregada exitosamente.');
        },
        error: (err) => this.lanzarNotificacion('error', 'Error al registrar', err.error?.error || 'No se pudo completar la operación.')
      });
    }
  }

  prepararEliminacion(id: number) {
    this.cuentaAEliminar.set(id);
    this.mostrarModalEliminar.set(true);
    this.otpEliminar.set('');
  }

  confirmarEliminacion() {
    if (this.cuentaAEliminar() && this.otpEliminar().length === 6) {
      this.billeteraService.eliminarCuentaBancaria(this.cuentaAEliminar()!, this.otpEliminar()).subscribe({
        next: () => {
            this.mostrarModalEliminar.set(false);
            this.cuentaAEliminar.set(null);
            this.cargarDatos();
        },
        error: (err) => alert(err.error?.error || 'Error al eliminar cuenta')
      });
    }
  }

  solicitarRetiro() {
    if (this.retiroForm.valid) {
      this.billeteraService.solicitarRetiro(this.retiroForm.value as any).subscribe({
        next: () => {
          this.mostrarModalRetiro.set(false);
          this.retiroForm.reset({ monto: 0 });
          this.otpEnviado.update(v => ({ ...v, ['WALLET_WITHDRAW']: false }));
          this.cargarDatos();
          this.lanzarNotificacion('success', 'Solicitud Recibida', 'Tu retiro está siendo procesado. Los fondos llegarán pronto.');
        },
        error: (err) => this.lanzarNotificacion('error', 'Fallo en el Retiro', err.error?.error || 'Error del sistema')
      });
    }
  }

  lanzarNotificacion(tipo: 'success' | 'error', titulo: string, mensaje: string) {
    this.notificacion.set({ mostrar: true, tipo, titulo, mensaje });
  }

  cerrarNotificacion() {
    this.notificacion.set(null);
  }

  getTipoClase(tipo: string): string {
    switch(tipo) {
      case 'ABONO': return 'text-success';
      case 'RETIRO': return 'text-error';
      default: return 'text-info';
    }
  }
}
