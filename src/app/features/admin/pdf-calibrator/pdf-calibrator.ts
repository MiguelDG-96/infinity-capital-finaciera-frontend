import { Component, ElementRef, HostListener, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker desde CDN para evitar problemas de webpack con Angular
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

@Component({
  selector: 'app-pdf-calibrator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-calibrator.html',
  styleUrl: './pdf-calibrator.css',
})
export class PdfCalibrator implements OnInit, AfterViewInit {
  @ViewChild('pdfCanvas') pdfCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('previewContainer') previewContainer!: ElementRef<HTMLDivElement>;

  pdfDoc: any = null;
  currentScale = 1.6;
  currentTab = 'identidad';
  currentPage = 1;
  totalPages = 0;
  
  isDragging = false;
  activeHandle: string | null = null;
  isLoading = true;

  // Coordenadas base
  currentCoords: any = {
    "dni_check": {
        "x": 34,
        "y": 686,
        "page": 0
    },
    "dni_digits": {
        "startX": 348,
        "y": 692,
        "spacing": 8.7,
        "page": 0
    },
    "apellido_paterno": {
        "x": 107,
        "y": 665,
        "page": 0
    },
    "apellido_materno": {
        "x": 279,
        "y": 665,
        "page": 0
    },
    "nombres": {
        "x": 463,
        "y": 665,
        "page": 0
    },
    "nacionalidad": {
        "x": 476,
        "y": 650,
        "page": 0
    },
    "check_secundaria": {
        "x": 90,
        "y": 507,
        "page": 0
    },
    "check_tecnica": {
        "x": 154,
        "y": 508,
        "page": 0
    },
    "check_universitaria": {
        "x": 208,
        "y": 507,
        "page": 0
    },
    "check_completa": {
        "x": 262,
        "y": 506,
        "page": 0
    },
    "check_incompleta": {
        "x": 319,
        "y": 507,
        "page": 0
    },
    "fecha_solicitud_digits": {
        "startX": 379,
        "y": 778,
        "spacing": 5.99,
        "page": 0
    },
    "fecha_nacimiento_digits": {
        "startX": 126,
        "y": 650,
        "spacing": 5.99,
        "page": 0
    },
    "check_soltero": {
        "x": 79,
        "y": 632,
        "page": 0
    },
    "check_casado": {
        "x": 130,
        "y": 636,
        "page": 0
    },
    "check_viudo": {
        "x": 183,
        "y": 637,
        "page": 0
    },
    "check_divorciado": {
        "x": 227,
        "y": 635,
        "page": 0
    },
    "telefono": {
        "x": 104,
        "y": 595,
        "page": 0
    },
    "celular": {
        "x": 523,
        "y": 596,
        "page": 0
    },
    "correo_electronico": {
        "x": 379,
        "y": 596,
        "page": 0
    },
    "check_sexo_f": {
        "x": 282,
        "y": 650,
        "page": 0
    },
    "check_sexo_m": {
        "x": 302,
        "y": 649,
        "page": 0
    },
    "check_estudios": {
        "x": 35,
        "y": 741,
        "page": 0
    },
    "check_negocio": {
        "x": 85,
        "y": 742,
        "page": 0
    },
    "check_personal": {
        "x": 130,
        "y": 742,
        "page": 0
    },
    "check_vehicular": {
        "x": 179,
        "y": 742,
        "page": 0
    },
    "check_hipotecario": {
        "x": 226,
        "y": 742,
        "page": 0
    },
    "check_empresarial": {
        "x": 285,
        "y": 742,
        "page": 0
    },
    "check_exclusivo_si": {
        "x": 115,
        "y": 732,
        "page": 0
    },
    "check_exclusivo_no": {
        "x": 173,
        "y": 732,
        "page": 0
    },
    "check_moneda_soles": {
        "x": 261,
        "y": 730,
        "page": 0
    },
    "check_moneda_dolares": {
        "x": 296,
        "y": 732,
        "page": 0
    },
    "departamento": {
        "x": 490,
        "y": 538,
        "page": 0
    },
    "provincia": {
        "x": 375,
        "y": 538,
        "page": 0
    },
    "distrito": {
        "x": 248,
        "y": 538,
        "page": 0
    },
    "direccion": {
        "x": 76,
        "y": 560,
        "page": 0
    },
    "urbanizacion": {
        "x": 404,
        "y": 561,
        "page": 0
    },
    "manzana": {
        "x": 260,
        "y": 561,
        "page": 0
    },
    "lote": {
        "x": 308,
        "y": 560,
        "page": 0
    },
    "codigo_postal": {
        "x": 118,
        "y": 538,
        "page": 0
    },
    "check_dependiente": {
        "x": 35,
        "y": 463,
        "page": 0
    },
    "check_independiente": {
        "x": 88,
        "y": 462,
        "page": 0
    },
    "empresa": {
        "x": 229,
        "y": 398,
        "page": 0
    },
    "cargo_ocupacion": {
        "x": 274,
        "y": 443,
        "page": 0
    },
    "ingreso_mensual": {
        "x": 66,
        "y": 297,
        "page": 0
    },
    "ingreso_bruto_mensual": {
        "x": 155,
        "y": 298,
        "page": 0
    },
    "ruc_empresa_digits": {
        "startX": 74,
        "y": 396,
        "spacing": 9.7,
        "page": 0
    },
    "ruc_propio_digits": {
        "startX": 74,
        "y": 397,
        "spacing": 9.7,
        "page": 0
    },
    "telefono_empresa": {
        "x": 439,
        "y": 300,
        "page": 0
    },
    "fecha_ingreso_laboral_digits": {
        "startX": 175,
        "y": 325,
        "spacing": 5.7,
        "page": 0
    },
    "direccion_empresa": {
        "x": 76,
        "y": 345,
        "page": 0
    },
    "nombres_conyuge": {
        "x": 411,
        "y": 205,
        "page": 0
    },
    "apellido_pa_conyuge": {
        "x": 49,
        "y": 205,
        "page": 0
    },
    "apellido_mat_conyuge": {
        "x": 229,
        "y": 205,
        "page": 0
    },
    "conyuge_dni_digits": {
        "startX": 329,
        "y": 227,
        "spacing": 9.7,
        "page": 0
    },
    "conyuge_ocupacion": {
        "x": 489,
        "y": 87,
        "page": 0
    },
    "conyuge_ingreso_mensual": {
        "x": 65,
        "y": 61,
        "page": 0
    },
    "conyuge_telefono": {
        "x": 461,
        "y": 153,
        "page": 0
    },
    "conyuge_nacionalidad": {
        "x": 278,
        "y": 189,
        "page": 0
    },
    "check_dni_conyuge": {
        "x": 33,
        "y": 225,
        "page": 0
    },
    "check_carnet_conyuge": {
        "x": 158,
        "y": 225,
        "page": 0
    },
    "activo_auto": {
        "x": 156,
        "y": 767,
        "page": 1
    },
    "activo_inmueble": {
        "x": 156,
        "y": 750,
        "page": 1
    },
    "activo_ahorros": {
        "x": 156,
        "y": 735,
        "page": 1
    },
    "activo_plazofijo": {
        "x": 156,
        "y": 720,
        "page": 1
    },
    "activo_otros": {
        "x": 156,
        "y": 707,
        "page": 1
    },
    "total_activos": {
        "x": 156,
        "y": 693,
        "page": 1
    },
    "pasivo_tarjetas": {
        "x": 320,
        "y": 753,
        "page": 1
    },
    "pasivo_tarjetas_cuota": {
        "x": 483,
        "y": 754,
        "page": 1
    },
    "pasivo_tarjetas_vencimiento": {
        "x": 401,
        "y": 752,
        "page": 1
    },
    "pasivo_cortoplazo": {
        "x": 318,
        "y": 767,
        "page": 1
    },
    "pasivo_cortoplazo_cuota": {
        "x": 481,
        "y": 767,
        "page": 1
    },
    "pasivo_cortoplazo_vencimiento": {
        "x": 401,
        "y": 767,
        "page": 1
    },
    "pasivo_largoplazo": {
        "x": 321,
        "y": 738,
        "page": 1
    },
    "pasivo_largoplazo_cuota": {
        "x": 484,
        "y": 738,
        "page": 1
    },
    "pasivo_largoplazo_vencimiento": {
        "x": 402,
        "y": 737,
        "page": 1
    },
    "pasivo_hipotecario": {
        "x": 320,
        "y": 723,
        "page": 1
    },
    "pasivo_hipotecario_cuota": {
        "x": 484,
        "y": 723,
        "page": 1
    },
    "pasivo_hipotecario_vencimiento": {
        "x": 401,
        "y": 723,
        "page": 1
    },
    "pasivo_otros": {
        "x": 320,
        "y": 709,
        "page": 1
    },
    "pasivo_otros_cuota": {
        "x": 483,
        "y": 709,
        "page": 1
    },
    "pasivo_otros_vencimiento": {
        "x": 399,
        "y": 708,
        "page": 1
    },
    "total_pasivos": {
        "x": 323,
        "y": 693,
        "page": 1
    },
    "patrimonio_neto": {
        "x": 186,
        "y": 678,
        "page": 1
    },
    "tasa": {
        "x": 250,
        "y": 490,
        "page": 1
    },
    "plazo_meses": {
        "x": 84,
        "y": 580,
        "page": 1
    },
    "correo_envio": {
        "x": 169,
        "y": 357,
        "page": 1
    },
    "firma_titular_nombre": {
        "x": 56,
        "y": 621,
        "page": 8
    },
    "firma_titular_doc": {
        "x": 59,
        "y": 579,
        "page": 8
    },
    "firma_conyuge_nombre": {
        "x": 252,
        "y": 622,
        "page": 8
    },
    "firma_conyuge_doc": {
        "x": 252,
        "y": 579,
        "page": 8
    },
    "cronograma_monto": {
        "x": 160,
        "y": 765,
        "page": 8
    },
    "cronograma_cuotas": {
        "x": 160,
        "y": 750,
        "page": 8
    },
    "cronograma_fecha": {
        "x": 160,
        "y": 735,
        "page": 8
    },
    "monto_solicitado": {
        "x": 119,
        "y": 487,
        "page": 1
    },
    "cuota_mensual": {
        "x": 373,
        "y": 451,
        "page": 1
    },
    "cuenta_abono_digits": {
        "startX": 285,
        "y": 542,
        "spacing": 8.7,
        "page": 1
    }
};

  coordsString = '';

  mockData: any = {
    "dni": "75776105",
    "fecha_solicitud_digits": "06042026",
    "fecha_nacimiento_digits": "15081995",
    "apellido_paterno": "DOLIC",
    "apellido_materno": "GARCIA", 
    "nombres": "RAUL CHRISTIAN", 
    "direccion": "AV. JAVIER PRADO 1500", 
    "monto_solicitado": "S/ 5,000.00",
    "cuota_mensual": "S/ 450.00",
    "correo_envio": "raul.mendoza@email.com",
    "ruc_empresa_digits": "10757761055",
    "ruc_propio_digits": "10757761055",
    "fecha_ingreso_laboral_digits": "0426",
    "ingreso_mensual": "S/ 1,500.00",
    "ingreso_bruto_mensual": "S/ 2,000.00",
    "nombres_conyuge": "MARIA",
    "apellido_pa_conyuge": "LOPEZ",
    "apellido_mat_conyuge": "PEREZ",
    "conyuge_dni_digits": "45678912",
    "conyuge_ocupacion": "DOCENTE",
    "conyuge_ingreso_mensual": "S/ 1,200.00",
    "conyuge_telefono": "987654321",
    "conyuge_nacionalidad": "PERUANA",
    "firma_titular_nombre": "JUAN PEREZ",
    "firma_titular_doc": "DNI 12345678",
    "firma_conyuge_nombre": "MARIA LOPEZ",
    "firma_conyuge_doc": "DNI 45678912",
    "activo_auto": "S/ 15,000",
    "activo_inmueble": "S/ 150,000",
    "activo_ahorros": "S/ 10,000",
    "activo_plazofijo": "S/ 5,000",
    "activo_otros": "S/ 2,000",
    "total_activos": "S/ 182,000",
    "pasivo_tarjetas": "S/ 3,000",
    "pasivo_tarjetas_cuota": "S/ 300",
    "pasivo_tarjetas_vencimiento": "12/2026",
    "pasivo_cortoplazo": "S/ 5,000",
    "pasivo_cortoplazo_cuota": "S/ 500",
    "pasivo_cortoplazo_vencimiento": "06/2027",
    "pasivo_largoplazo": "S/ 10,000",
    "pasivo_largoplazo_cuota": "S/ 400",
    "pasivo_largoplazo_vencimiento": "05/2030",
    "pasivo_hipotecario": "S/ 50,000",
    "pasivo_hipotecario_cuota": "S/ 800",
    "pasivo_hipotecario_vencimiento": "01/2040",
    "pasivo_otros": "S/ 1,000",
    "pasivo_otros_cuota": "S/ 100",
    "pasivo_otros_vencimiento": "12/2028",
    "total_pasivos": "S/ 69,000",
    "patrimonio_neto": "S/ 113,000",
    "cuenta_abono_digits": "19112345678012",
    "tasa": "5%"
  };

  categories: any = {
    identidad: ['dni_check', 'dni_digits', 'fecha_solicitud_digits', 'fecha_nacimiento_digits', 'check_sexo_f', 'check_sexo_m', 'check_soltero', 'check_casado', 'check_viudo', 'check_divorciado', 'telefono', 'celular', 'correo_electronico', 'apellido_paterno', 'apellido_materno', 'nombres', 'nacionalidad', 'check_secundaria', 'check_tecnica', 'check_universitaria', 'check_completa', 'check_incompleta'],
    ubicacion: ['departamento', 'provincia', 'distrito', 'direccion', 'urbanizacion', 'manzana', 'lote', 'codigo_postal'],
    laboral: ['check_dependiente', 'check_independiente', 'empresa', 'cargo_ocupacion', 'ingreso_mensual', 'ingreso_bruto_mensual', 'ruc_empresa_digits', 'ruc_propio_digits', 'telefono_empresa', 'fecha_ingreso_laboral_digits', 'direccion_empresa'],
    conyuge: ['nombres_conyuge', 'apellido_pa_conyuge', 'apellido_mat_conyuge', 'check_dni_conyuge', 'check_carnet_conyuge', 'conyuge_dni_digits', 'conyuge_ocupacion', 'conyuge_ingreso_mensual', 'conyuge_telefono', 'conyuge_nacionalidad'],
    patrimonio: ['activo_auto', 'activo_inmueble', 'activo_ahorros', 'activo_plazofijo', 'activo_otros', 'total_activos', 'pasivo_tarjetas', 'pasivo_tarjetas_cuota', 'pasivo_tarjetas_vencimiento', 'pasivo_cortoplazo', 'pasivo_cortoplazo_cuota', 'pasivo_cortoplazo_vencimiento', 'pasivo_largoplazo', 'pasivo_largoplazo_cuota', 'pasivo_largoplazo_vencimiento', 'pasivo_hipotecario', 'pasivo_hipotecario_cuota', 'pasivo_hipotecario_vencimiento', 'pasivo_otros', 'pasivo_otros_cuota', 'pasivo_otros_vencimiento', 'total_pasivos', 'patrimonio_neto'],
    credito: ['check_estudios', 'check_negocio', 'check_personal', 'check_vehicular', 'check_hipotecario', 'check_empresarial', 'check_exclusivo_si', 'check_exclusivo_no', 'check_moneda_soles', 'check_moneda_dolares'],
    calificacion: ['monto_solicitado', 'cuota_mensual', 'plazo_meses', 'tasa', 'cuenta_abono_digits', 'correo_envio'],
    firmas: ['firma_titular_nombre', 'firma_titular_doc', 'firma_conyuge_nombre', 'firma_conyuge_doc']
  };

  tabs = Object.keys(this.categories);
  
  // Expose Object.keys for the template
  objectKeys = Object.keys;

  constructor() {
    this.updateCoordsString();
  }

  ngOnInit() {}

  async ngAfterViewInit() {
    try {
      const loadingTask = pdfjsLib.getDocument({
        url: '/pdf/contrato_template_v2.pdf',
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
      });
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.isLoading = false;
      this.renderCurrentPage();
    } catch (err) {
      console.error('Error cargando PDF', err);
      alert('Error cargando PDF. Asegúrese de que /pdf/contrato_template_v2.pdf existe.');
    }
  }

  changePage(delta: number) {
    const next = this.currentPage + delta;
    if (this.pdfDoc && next >= 1 && next <= this.pdfDoc.numPages) {
      this.currentPage = next;
      this.renderCurrentPage();
    }
  }

  switchTab(tabId: string) {
    this.currentTab = tabId;
    const firstField = this.categories[tabId][0];
    if (this.currentCoords[firstField]) {
      const targetPage = (this.currentCoords[firstField].page || 0) + 1;
      if (targetPage !== this.currentPage) {
        this.currentPage = targetPage;
        this.renderCurrentPage();
      }
    }
  }

  updateZoom(event: any) {
    this.currentScale = parseFloat(event.target.value);
    this.renderCurrentPage();
  }

  async renderCurrentPage() {
    if (!this.pdfDoc || !this.pdfCanvas) return;
    try {
      const page = await this.pdfDoc.getPage(this.currentPage);
      const viewport = page.getViewport({ scale: this.currentScale });
      const canvas = this.pdfCanvas.nativeElement;
      const context = canvas.getContext('2d');
      const container = this.previewContainer.nativeElement;
      
      container.style.width = `${595 * this.currentScale}px`;
      container.style.height = `${842 * this.currentScale}px`;
      canvas.width = 595 * this.currentScale;
      canvas.height = 842 * this.currentScale;
      
      await page.render({ canvasContext: context as any, viewport: viewport }).promise;
    } catch (err) {
      console.error("Error renderizando página:", err);
    }
  }

  get activeHandles() {
    const fields = this.categories[this.currentTab];
    return fields.filter((key: string) => {
      const coord = this.currentCoords[key];
      return coord && (coord.page + 1) === this.currentPage;
    }).map((key: string) => {
      const coord = this.currentCoords[key];
      let contentHtml = '';
      let isDigits = key.includes('_digits');
      let isCheck = key.includes('check');
      let textContent = this.mockData[key] || (isCheck ? 'X' : key.toUpperCase());
      let letterSpacing = 'normal';

      if (isDigits) {
        const val = this.mockData[key] || '12345678';
        const digits = val.split('');
        contentHtml = digits.map((d: string) => `<span>${d}</span>`).join('');
        letterSpacing = `${(coord.spacing * this.currentScale) - 7}px`;
        textContent = '';
      }

      const x = (coord.x || coord.startX || 50) * this.currentScale;
      const y = (842 - (coord.y || 100)) * this.currentScale;

      return {
        key,
        x,
        y,
        fontSize: 8 * this.currentScale,
        isCheck,
        isDigits,
        contentHtml,
        textContent,
        letterSpacing,
        coord
      };
    });
  }

  startDrag(event: MouseEvent, key: string) {
    this.isDragging = true;
    this.activeHandle = key;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging || !this.activeHandle || !this.previewContainer) return;
    
    const container = this.previewContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    
    const x = (event.clientX - rect.left) / this.currentScale;
    const y = (event.clientY - rect.top) / this.currentScale;

    const finalX = Math.round(Math.max(0, Math.min(595, x)));
    const finalY = Math.round(Math.max(0, Math.min(842, 842 - y)));

    const coord = this.currentCoords[this.activeHandle];
    if (coord.startX !== undefined) coord.startX = finalX;
    else coord.x = finalX;
    coord.y = finalY;

    this.updateCoordsString();
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
    this.activeHandle = null;
  }

  updateValue(key: string, prop: string, event: any) {
    const value = parseFloat(event.target.value);
    this.currentCoords[key][prop] = value;
    if (prop === 'page') {
      this.renderCurrentPage();
    }
    this.updateCoordsString();
  }

  updateCoordsString() {
    this.coordsString = JSON.stringify(this.currentCoords, null, 4);
  }

  onCoordsEditorChange(event: any) {
    try {
      this.currentCoords = JSON.parse(event.target.value);
      this.renderCurrentPage();
    } catch(e) {}
  }

  copyConfig() {
    navigator.clipboard.writeText(this.coordsString).then(() => {
      alert('¡Copiado!');
    });
  }
}
