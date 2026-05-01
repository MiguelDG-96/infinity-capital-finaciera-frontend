// src/app/features/dashboard/pages/solicitar-credito/solicitar-credito.component.ts

import { Component, OnInit, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CreditoService } from '../../../../core/services/credito.service';
import { SolicitudCredito } from '../../../../core/models/credito.model';

@Component({
  selector: 'app-solicitar-credito',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink],
  templateUrl: './solicitar-credito.component.html',
  styleUrl: './solicitar-credito.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SolicitarCreditoComponent implements OnInit {
  solicitudForm!: FormGroup;
  enviando = false;
  error = '';
  exito = false;

  // Multi-step logic
  currentStep = 1;
  totalSteps = 5;

  // Catalog data
  tiposDocumento = ['DNI', 'CARNET_EXTRANJERIA', 'PASAPORTE'];
  tiposPersona = ['NATURAL', 'JURIDICA'];
  estadosCiviles = ['SOLTERO', 'CASADO', 'CONVIVIENTE', 'DIVORCIADO', 'VIUDO'];
  gradosInstruccion = ['SECUNDARIA', 'TECNICA', 'SUPERIOR_UNIV', 'POSTGRADO', 'PRIMARIA'];
  situacionesLaborales = ['DEPENDIENTE', 'INDEPENDIENTE', 'JUBILADO'];

  tiposCredito: { 
    id: number, 
    nombre: string, 
    temDefecto: number,
    rangos?: { montoMinimo: number, montoMaximo: number, tasaMensual: number }[]
  }[] = [];
  monedas: { id: number, nombre: string, simbolo: string }[] = [];
  cargandoCatalogo = true;

  // Simulador
  cuotaEstimada = 0;
  temSeleccionada = 0;
  totalInteres = 0;
  totalPagar = 0;
  cronogramaSimulado: any[] = [];

  constructor(
    private fb: FormBuilder,
    private creditoService: CreditoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarCatalogos();

    // Recalcular cuota cuando cambien valores relevantes
    this.solicitudForm.valueChanges.subscribe(() => {
      this.calcularCuota();
    });
  }

  private initForm(): void {
    this.solicitudForm = this.fb.group({
      // Paso 1: Crédito
      tipoPersona: ['NATURAL', [Validators.required]],
      tipoCreditoId: ['', [Validators.required]],
      monedaId: ['', [Validators.required]],
      montoSolicitado: [1000, [Validators.required, Validators.min(100), Validators.max(1000000)]],
      plazoMeses: [12, [Validators.required, Validators.min(1), Validators.max(60)]],
      periodoGracia: [0, [Validators.min(0), Validators.max(6)]],
      cuentaDesembolso: ['', [Validators.required, Validators.minLength(10)]],

      // Paso 2: Identidad y Contacto
      tipoDocumento: ['DNI', [Validators.required]],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9A-Z]+$'), Validators.minLength(8)]],
      nacionalidad: ['PERUANA', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      estadoCivil: ['SOLTERO', [Validators.required]],
      gradoInstruccion: ['SECUNDARIA', [Validators.required]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      telefono: [''],

      // Paso 3: Ubicación
      departamento: ['LIMA', [Validators.required]],
      provincia: ['LIMA', [Validators.required]],
      distrito: ['', [Validators.required]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      urbanizacion: [''],
      manzana: [''],
      lote: [''],
      codigoPostal: [''],
      referencia: ['', [Validators.required]],

      // Paso 4: Laboral
      situacionLaboral: ['DEPENDIENTE', [Validators.required]],
      cargoOcupacion: ['', [Validators.required]],
      ingresoBrutoMensual: [0, [Validators.required, Validators.min(100)]],
      fechaIngresoLaboral: ['', [Validators.required]],
      rucPropio: [''],
      
      // Detalles empleador (Si es DEPENDIENTE)
      empresa: [''],
      rucEmpresa: [''],
      direccionEmpresa: [''],
      numeroDependientes: [0],
      
      // Jurídica (Condicional)
      razonSocialJuridica: [''],
      rucJuridico: [''],
      representanteLegal: [''],

      // Paso 5: Garante y Cónyuge
      conyugeNombre: [''],
      conyugeDni: [''],
      conyugeOcupacion: [''],

      // Garante (Opcional)
      garanteNombre: [''],
      garanteDni: [''],
      garanteTelefono: [''],
      
      // Finalización
      canalEstadoCuenta: ['EMAIL', [Validators.required]],
      terminosAceptados: [false, [Validators.requiredTrue]]
    });

    // Validaciones condicionales
    this.solicitudForm.get('tipoPersona')?.valueChanges.subscribe(val => {
      if (val === 'JURIDICA') {
        this.solicitudForm.get('razonSocialJuridica')?.setValidators([Validators.required]);
        this.solicitudForm.get('rucJuridico')?.setValidators([Validators.required, Validators.minLength(11)]);
        this.solicitudForm.get('representanteLegal')?.setValidators([Validators.required]);
      } else {
        this.solicitudForm.get('razonSocialJuridica')?.clearValidators();
        this.solicitudForm.get('rucJuridico')?.clearValidators();
        this.solicitudForm.get('representanteLegal')?.clearValidators();
      }
      this.solicitudForm.get('razonSocialJuridica')?.updateValueAndValidity();
      this.solicitudForm.get('rucJuridico')?.updateValueAndValidity();
      this.solicitudForm.get('representanteLegal')?.updateValueAndValidity();
    });

    this.solicitudForm.get('estadoCivil')?.valueChanges.subscribe(val => {
      if (['CASADO', 'CONVIVIENTE'].includes(val)) {
        this.solicitudForm.get('conyugeNombre')?.setValidators([Validators.required]);
        this.solicitudForm.get('conyugeDni')?.setValidators([Validators.required, Validators.minLength(8)]);
      } else {
        this.solicitudForm.get('conyugeNombre')?.clearValidators();
        this.solicitudForm.get('conyugeDni')?.clearValidators();
      }
      this.solicitudForm.get('conyugeNombre')?.updateValueAndValidity();
      this.solicitudForm.get('conyugeDni')?.updateValueAndValidity();
    });

    this.solicitudForm.get('situacionLaboral')?.valueChanges.subscribe(val => {
      if (val === 'INDEPENDIENTE') {
        this.solicitudForm.get('rucPropio')?.setValidators([Validators.required, Validators.minLength(11)]);
        this.solicitudForm.get('empresa')?.clearValidators();
        this.solicitudForm.get('rucEmpresa')?.clearValidators();
      } else if (val === 'DEPENDIENTE') {
        this.solicitudForm.get('rucPropio')?.clearValidators();
        this.solicitudForm.get('empresa')?.setValidators([Validators.required]);
        this.solicitudForm.get('rucEmpresa')?.setValidators([Validators.required, Validators.minLength(11)]);
      } else {
        this.solicitudForm.get('rucPropio')?.clearValidators();
        this.solicitudForm.get('empresa')?.clearValidators();
        this.solicitudForm.get('rucEmpresa')?.clearValidators();
      }
      this.solicitudForm.get('rucPropio')?.updateValueAndValidity();
      this.solicitudForm.get('empresa')?.updateValueAndValidity();
      this.solicitudForm.get('rucEmpresa')?.updateValueAndValidity();
    });
  }

  cargarCatalogos(): void {
    this.creditoService.obtenerMonedasActivas().subscribe({
      next: (data) => {
        this.monedas = data;
        if (data.length > 0) {
          this.solicitudForm.patchValue({ monedaId: data[0].id }, { emitEvent: false });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando monedas', err);
        this.cdr.detectChanges();
      }
    });
    
    this.creditoService.obtenerTiposCreditoActivos().subscribe({
      next: (data) => {
        this.tiposCredito = data as any[];
        if (data.length > 0) {
          this.solicitudForm.patchValue({ tipoCreditoId: data[0].id }, { emitEvent: false });
          this.calcularCuota();
        }
        this.cargandoCatalogo = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando tipos de créditos', err);
        this.cargandoCatalogo = false;
        this.cdr.detectChanges();
      }
    });
  }

  nextStep(): void {
    if (this.canContinue()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.cdr.detectChanges();
      }
    } else {
      this.markStepAsTouched();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.cdr.detectChanges();
    }
  }

  private canContinue(): boolean {
    const fieldsByStep: { [key: number]: string[] } = {
      1: ['tipoPersona', 'tipoCreditoId', 'monedaId', 'montoSolicitado', 'plazoMeses', 'cuentaDesembolso'],
      2: ['tipoDocumento', 'numeroDocumento', 'nacionalidad', 'fechaNacimiento', 'estadoCivil', 'gradoInstruccion', 'celular'],
      3: ['departamento', 'provincia', 'distrito', 'direccion', 'referencia'],
      4: ['situacionLaboral', 'cargoOcupacion', 'ingresoBrutoMensual', 'fechaIngresoLaboral'],
      5: ['terminosAceptados']
    };

    const fields = fieldsByStep[this.currentStep] || [];
    let isValid = true;
    fields.forEach(field => {
      const control = this.solicitudForm.get(field);
      if (control && control.invalid) {
        isValid = false;
      }
    });

    // Validaciones extra para JURIDICA en paso 1 o 4
    if (this.currentStep === 4 && this.solicitudForm.get('tipoPersona')?.value === 'JURIDICA') {
      if (this.solicitudForm.get('razonSocialJuridica')?.invalid || 
          this.solicitudForm.get('rucJuridico')?.invalid ||
          this.solicitudForm.get('representanteLegal')?.invalid) {
        isValid = false;
      }
    }
    
    // Validaciones extra para DEPENDIENTE en paso 4
    if (this.currentStep === 4 && this.solicitudForm.get('situacionLaboral')?.value === 'DEPENDIENTE') {
      if (this.solicitudForm.get('empresa')?.invalid || 
          this.solicitudForm.get('rucEmpresa')?.invalid) {
        isValid = false;
      }
    }

    return isValid;
  }

  private markStepAsTouched(): void {
    const fieldsByStep: { [key: number]: string[] } = {
      1: ['tipoPersona', 'tipoCreditoId', 'monedaId', 'montoSolicitado', 'plazoMeses', 'cuentaDesembolso'],
      2: ['tipoDocumento', 'numeroDocumento', 'nacionalidad', 'fechaNacimiento', 'estadoCivil', 'gradoInstruccion', 'celular', 'telefono'],
      3: ['departamento', 'provincia', 'distrito', 'direccion', 'referencia'],
      4: ['situacionLaboral', 'cargoOcupacion', 'ingresoBrutoMensual', 'fechaIngresoLaboral', 'rucPropio', 'empresa', 'rucEmpresa', 'direccionEmpresa', 'razonSocialJuridica', 'rucJuridico', 'representanteLegal'],
      5: ['conyugeNombre', 'conyugeDni', 'garanteNombre', 'garanteDni', 'canalEstadoCuenta', 'terminosAceptados']
    };
    const fields = fieldsByStep[this.currentStep] || [];
    fields.forEach(field => this.solicitudForm.get(field)?.markAsTouched());
  }

  calcularCuota(): void {
    const { montoSolicitado, plazoMeses, tipoCreditoId, periodoGracia } = this.solicitudForm.value;
    const tipo = this.tiposCredito.find(t => t.id == tipoCreditoId);
    
    if (tipo && montoSolicitado > 0 && plazoMeses > 0) {
      let tasa = tipo.temDefecto || 5;
      
      if (tipo.rangos && tipo.rangos.length > 0) {
        const rangoEncontrado = tipo.rangos.find(r => 
          montoSolicitado >= r.montoMinimo && montoSolicitado <= r.montoMaximo
        );
        if (rangoEncontrado) {
          tasa = rangoEncontrado.tasaMensual;
        }
      }

      this.temSeleccionada = tasa;
      const i = this.temSeleccionada / 100;
      const n = plazoMeses;
      const G = periodoGracia || 0;

      // Amortización Francesa con periodo de gracia
      const nEfectivo = n - G;
      let cuotaExacta = 0;
      if (nEfectivo > 0) {
        cuotaExacta = montoSolicitado * (i * Math.pow(1 + i, nEfectivo)) / (Math.pow(1 + i, nEfectivo) - 1);
      } else {
        cuotaExacta = montoSolicitado * i;
      }

      this.cuotaEstimada = Math.round(cuotaExacta);
      
      // Simular cronograma
      let saldo = montoSolicitado;
      let totalInteres = 0;
      const cronograma = [];

      for (let k = 1; k <= n; k++) {
        let interes = Math.round(saldo * i * 100) / 100;
        let pactual = (k <= G) ? 0 : Math.round((cuotaExacta - interes) * 100) / 100;
        
        if (k === n && k > G) {
          pactual = Math.round(saldo * 100) / 100;
        }

        if (pactual < 0) pactual = 0;
        let cuotaActual = Math.round((interes + pactual) * 100) / 100;
        saldo = Math.round((saldo - pactual) * 100) / 100;
        if (saldo < 0) saldo = 0;

        totalInteres += interes;
        cronograma.push({
          numero: k,
          capital: pactual,
          interes: interes,
          total: cuotaActual,
          saldo: saldo,
          esGracia: k <= G
        });
      }

      this.totalInteres = Math.round(totalInteres);
      this.totalPagar = Math.round(montoSolicitado + totalInteres);
      this.cronogramaSimulado = cronograma;
    }
    this.cdr.detectChanges();
  }

  isFieldInvalid(field: string): boolean {
    const f = this.solicitudForm.get(field);
    return !!f && f.invalid && (f.dirty || f.touched);
  }

  getSimboloMoneda(): string {
    const id = this.solicitudForm.get('monedaId')?.value;
    const moneda = this.monedas.find(m => m.id == id);
    return moneda ? moneda.simbolo : 'S/';
  }

  onDateChange(event: any, field: string): void {
    const date = event.target.value;
    if (date) {
      this.solicitudForm.get(field)?.setValue(date);
      // Opcional: Cerrar el dropdown si se desea
      const activeElement = document.activeElement as HTMLElement;
      activeElement?.blur();
    }
  }

  onSubmit(): void {
    if (this.solicitudForm.invalid) {
      this.solicitudForm.markAllAsTouched();
      return;
    }

    this.enviando = true;
    this.error = '';

    const solicitud: SolicitudCredito = {
      ...this.solicitudForm.value,
      domicilio: this.solicitudForm.get('direccion')?.value // Sync for compatibility
    };

    this.creditoService.solicitarCredito(solicitud).subscribe({
      next: (res) => {
        this.exito = true;
        this.enviando = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/dashboard/creditos/mis-creditos']);
        }, 3000);
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error al procesar la solicitud. Por favor intenta de nuevo.';
        this.enviando = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }
}
