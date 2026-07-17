import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ScrollRevealDirective } from '../../../../../shared/directives/scroll-reveal.directive';


@Component({
  selector: 'app-creditos-empresas',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, ScrollRevealDirective],
  templateUrl: './creditos-empresas.component.html'
})
export class CreditosEmpresasComponent {
  showRequisitos = false;

  requisitos = [
    { text: 'DNI de Representante Legal y Socios', subtext: '', icon: 'contact' },
    { text: 'Recibo de luz de domicilio', subtext: '', icon: 'zap' },
    { text: 'Testimonio de la empresa', subtext: '', icon: 'file-badge-2' },
    { text: 'Vigencia poder', subtext: '', icon: 'shield-check' },
    { text: 'Copia literal de la empresa', subtext: '', icon: 'building-2' },
    { text: 'Ficha RUC', subtext: '', icon: 'file-text' },
    { text: 'Reporte tributario', subtext: '', icon: 'bar-chart-2' },
    { text: '3 últimos PDT', subtext: '', icon: 'calendar-days' },
    { text: 'Sustento de ingresos', subtext: '(contratos, facturas, boletas, etc)', icon: 'file-spreadsheet' },
    { text: 'Un pantallazo de tus aplicativos de tus créditos vigentes', subtext: '', icon: 'monitor' },
    { text: 'Copia literal del bien inmueble', subtext: '', icon: 'landmark' }
  ];

  toggleRequisitos() {
    this.showRequisitos = !this.showRequisitos;
  }
}
