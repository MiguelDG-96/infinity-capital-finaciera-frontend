// src/app/core/utils/financiero.helper.ts

export interface CuotaSimulada {
  numero: number;
  fecha: Date;
  capital: number;
  interes: number;
  total: number;
  saldo: number;
}

export class FinancieroHelper {
  /**
   * Calcula un cronograma de pagos usando el método francés.
   * @param monto Monto total del crédito
   * @param plazo Meses totales
   * @param tem Tasa Efectiva Mensual (en porcentaje, ej: 5)
   * @param gracia Meses de gracia (solo interés)
   */
  static calcularAmortizacionFrancesa(
    monto: number,
    plazo: number,
    tem: number,
    gracia: number = 0,
    fechaInicio?: Date
  ): CuotaSimulada[] {
    const i = tem / 100;
    const nTotal = plazo;
    const nAmortizacion = nTotal - gracia;
    
    const redondear = (val: number) => Math.round(val * 100) / 100;

    let cuotaAmortizacion = 0;
    if (nAmortizacion > 0) {
      if (i === 0) {
        cuotaAmortizacion = monto / nAmortizacion;
      } else {
        cuotaAmortizacion = monto * (i * Math.pow(1 + i, nAmortizacion)) / (Math.pow(1 + i, nAmortizacion) - 1);
      }
      cuotaAmortizacion = redondear(cuotaAmortizacion);
    }

    const cuotas: CuotaSimulada[] = [];
    let saldo = redondear(monto);
    const fechaBase = fechaInicio ? new Date(fechaInicio) : new Date();

    for (let k = 1; k <= nTotal; k++) {
      const interesMes = redondear(saldo * i);
      let capitalMes = 0;
      let totalMes = 0;

      if (k <= gracia) {
        capitalMes = 0;
        totalMes = interesMes;
      } else {
        capitalMes = redondear(cuotaAmortizacion - interesMes);
        // Ajuste en la última cuota para evitar residuos de redondeo
        if (k === nTotal) {
          capitalMes = saldo;
        }
        // El total mensual es ESTRICATMENTE la suma de los valores
        totalMes = redondear(capitalMes + interesMes);
        saldo = redondear(saldo - capitalMes);
      }

      const fechaVencimiento = new Date(fechaBase);
      const diaOriginal = fechaBase.getDate();
      fechaVencimiento.setMonth(fechaBase.getMonth() + k);
      
      // Javascript setMonth() sufre de "overflow". Ej: 31 Enero + 1 mes = 31 Febrero = 3 Marzo.
      // Para solucionarlo, verificamos si el mes de la fecha resultante se saltó de largo.
      // Si el día original era mayor al día resultante, significa que hubo overflow.
      if (fechaVencimiento.getDate() < diaOriginal) {
        fechaVencimiento.setDate(0); // Retrocede al último día del mes anterior (el mes correcto)
      }

      cuotas.push({
        numero: k,
        fecha: fechaVencimiento,
        capital: Number(capitalMes.toFixed(2)),
        interes: Number(interesMes.toFixed(2)),
        total: Number(totalMes.toFixed(2)),
        saldo: Number(Math.max(0, saldo).toFixed(2))
      });
    }

    return cuotas;
  }
}
