import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ComprobanteConcept {
  description: string;
  value: number;
}

export interface ComprobanteData {
  customerName: string;
  customerAddress: string;
  customerDni: string;
  operationNumber: string;
  emissionDate: Date | string;
  paymentDate: Date | string;
  product: string;
  subProduct: string;
  installmentNumber: string;
  paymentToCapital: number;
  concepts: ComprobanteConcept[];
  isFullPayment: boolean;
  totalInWords?: string; // Optional, can be provided by backend
}

@Component({
  selector: 'app-comprobante-pago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comprobante-pago.html',
  styleUrls: ['./comprobante-pago.css'],
  encapsulation: ViewEncapsulation.None
})
export class ComprobantePagoComponent implements OnInit {
  @Input() data: ComprobanteData | null = null;
  
  businessInfo = {
    name: 'INFINYCAPITAL S.A.C.',
    ruc: '20614509903',
    address: 'Jr Dorado 301',
    phone: '954 862 745'
  };

  ngOnInit(): void {}

  get subTotal(): number {
    return this.data?.concepts.reduce((sum, item) => sum + item.value, 0) || 0;
  }

  get total(): number {
    return this.subTotal;
  }
  
  printReceipt(): void {
    const printContent = document.getElementById('comprobante-pdf');
    if (!printContent) return;

    // Crear un placeholder para saber dónde devolver el comprobante
    const placeholder = document.createElement('div');
    placeholder.id = 'print-placeholder';
    printContent.parentNode?.insertBefore(placeholder, printContent);

    // Cambiar temporalmente el título del documento para que el PDF tenga un nombre único
    const originalTitle = document.title;
    const documentName = `Comprobante_OPE_${this.data?.operationNumber}_${this.data?.customerDni}`;
    document.title = documentName;

    // Mover el comprobante directamente al body para evitar que el modal u otros contenedores afecten
    document.body.appendChild(printContent);
    document.body.classList.add('printing-receipt');

    // Esperar un momento para que el navegador aplique los estilos antes de imprimir
    setTimeout(() => {
      window.print();
      
      // Devolver el comprobante a su lugar original
      document.body.classList.remove('printing-receipt');
      document.title = originalTitle; // Restaurar el título original
      if (placeholder.parentNode) {
        placeholder.parentNode.insertBefore(printContent, placeholder);
        placeholder.remove();
      }
    }, 150);
  }
}

