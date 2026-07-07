import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreditRatingGaugeComponent, CreditRating } from '../../../../shared/components/credit-rating-gauge/credit-rating-gauge.component';

interface ClientProfile {
  nombre: string;
  dni: string;
  telefono: string;
  correo: string;
  creditosActivos: number;
  creditosCancelados: number;
  maxDiasMora: number;
  ingresoDeclarado: number;
  cuotasActuales: number;
  calificacion: CreditRating;
}

@Component({
  selector: 'app-admin-evaluacion-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-evaluacion-cliente.component.html',
  styleUrls: ['./admin-evaluacion-cliente.component.css']
})
export class AdminEvaluacionClienteComponent {
  constructor(private cdr: ChangeDetectorRef) {}
  searchDni: string = '';
  buscando: boolean = false;
  error: string = '';
  cliente: ClientProfile | null = null;

  buscarCliente() {
    if (!this.searchDni || this.searchDni.length < 8) {
      this.error = 'Ingrese un DNI válido (mínimo 8 dígitos).';
      return;
    }

    this.error = '';
    this.buscando = true;
    this.cliente = null;

    // Simular llamada al backend
    setTimeout(() => {
      this.buscando = false;

      // Mock data para diseño
      if (this.searchDni === '00000000') {
        this.error = 'Cliente no encontrado en la base de datos.';
        this.cdr.detectChanges();
        return;
      }

      // Dependiendo del último dígito, simulamos una calificación
      const lastDigit = parseInt(this.searchDni.slice(-1) || '0', 10);
      let calif: CreditRating = 'NORMAL';
      if (lastDigit > 2 && lastDigit <= 4) calif = 'PROBLEMAS_POTENCIALES';
      if (lastDigit > 4 && lastDigit <= 6) calif = 'DEFICIENTE';
      if (lastDigit > 6 && lastDigit <= 8) calif = 'DUDOSO';
      if (lastDigit > 8) calif = 'PERDIDA';

      this.cliente = {
        nombre: 'Juan Pérez ' + this.searchDni,
        dni: this.searchDni,
        telefono: '+51 987 654 321',
        correo: 'juan.perez@example.com',
        creditosActivos: lastDigit > 5 ? 2 : 1,
        creditosCancelados: 3,
        maxDiasMora: lastDigit * 15,
        ingresoDeclarado: 4500,
        cuotasActuales: 1250,
        calificacion: calif
      };
      this.cdr.detectChanges();
    }, 1200);
  }
}
