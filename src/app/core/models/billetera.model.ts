// src/app/core/models/billetera.model.ts

export interface CuentaVirtual {
  id: number;
  saldo: number;
  moneda: string;
  ultimaActualizacion: Date;
}

export interface TransaccionVirtual {
  id: number;
  tipo: 'ABONO' | 'RETIRO' | 'PAGO_CREDITO';
  monto: number;
  fecha: Date;
  fechaHora?: Date | string;
  descripcion: string;
  referencia?: string;
}

export interface CuentaBancaria {
  id: number;
  banco: string;
  numeroCuenta: string;
  tipoCuenta: 'AHORROS' | 'CORRIENTE';
  cci?: string;
}

export interface RetiroRequest {
  monto: number;
  cuentaBancariaId: number;
  motivo?: string;
  codigoVerificacion: string;
}

export interface CuentaBancariaRequest {
  banco: string;
  numeroCuenta: string;
  tipoCuenta: 'AHORROS' | 'CORRIENTE';
  cci?: string;
  codigoVerificacion: string;
}
