// src/app/features/dashboard/pages/solicitar-credito/solicitar-credito.component.ts

import { Component, OnInit, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';
import { CreditoService } from '../../../../core/services/credito.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { SolicitudCredito } from '../../../../core/models/credito.model';
import { FinancieroHelper } from '../../../../core/utils/financiero.helper';

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
  private readonly DRAFT_KEY = 'draft_solicitar_credito';

  // Multi-step logic
  currentStep = 1;
  totalSteps = 5;

  // Catalog data
  tiposDocumento = ['DNI', 'CARNET_EXTRANJERIA', 'PASAPORTE'];
  tiposPersona = ['NATURAL', 'JURIDICA'];
  estadosCiviles = ['SOLTERO', 'CASADO', 'CONVIVIENTE', 'DIVORCIADO', 'VIUDO'];
  gradosInstruccion = ['SECUNDARIA', 'TECNICA', 'UNIVERSITARIO'];
  situacionesLaborales = ['DEPENDIENTE', 'INDEPENDIENTE'];

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
    private clienteService: ClienteService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarCatalogos();

    // Solo cargamos el perfil del backend automáticamente si es ROLE_CLIENTE
    // (los admins y trabajadores usarán este formulario para registrar a otras personas)
    const rolUsuario = this.authService.currentUserData()?.rol;
    if (rolUsuario === 'ROLE_CLIENTE') {
      // El borrador se cargará DESPUÉS de que responda el servidor para evitar que se crucen
      this.cargarPerfilCliente();
    } else {
      // Si no es cliente, simplemente cargamos el borrador (si existiera)
      this.cargarBorrador();
    }

    // Recalcular cuota cuando cambien valores relevantes y guardar borrador
    this.solicitudForm.valueChanges.subscribe((val) => {
      this.calcularCuota();
      this.guardarBorrador(val);
    });
  }

  private guardarBorrador(data: any): void {
    try {
      localStorage.setItem(this.DRAFT_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Error guardando borrador en localStorage', e);
    }
  }

  private cargarBorrador(): void {
    try {
      const draft = localStorage.getItem(this.DRAFT_KEY);
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        // Usar patchValue para evitar sobreescribir valores fijos
        this.solicitudForm.patchValue(parsedDraft, { emitEvent: false });
      }
    } catch (e) {
      console.warn('Error leyendo borrador desde localStorage', e);
    }
  }

  limpiarFormulario(): void {
    if (confirm('¿Estás seguro de que deseas limpiar todo el formulario? Perderás todos los datos ingresados.')) {
      this.solicitudForm.reset();
      localStorage.removeItem(this.DRAFT_KEY);
      
      // Volvemos a cargar el perfil base y valores por defecto
      this.solicitudForm.patchValue({
        tipoPersona: 'NATURAL',
        tipoDocumento: 'DNI',
        nacionalidad: 'PERUANA',
        estadoCivil: 'SOLTERO',
        gradoInstruccion: 'SECUNDARIA',
        situacionLaboral: 'DEPENDIENTE',
        canalEstadoCuenta: 'EMAIL',
        terminosAceptados: false,
        montoSolicitado: 1000,
        plazoMeses: 12,
        periodoGracia: 0,
        numeroDependientes: 0
      });
      this.cargarPerfilCliente();
      this.calcularCuota();
      
      // Volver al paso 1
      this.currentStep = 1;
      this.cdr.detectChanges();
    }
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
      bancoDesembolso: ['', [Validators.required]],
      cuentaDesembolso: ['', [Validators.required]],

      // Paso 2: Identidad y Contacto
      tipoDocumento: ['DNI', [Validators.required]],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9A-Z]+$'), Validators.minLength(8)]],
      nacionalidad: ['PERUANA', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      sexo: ['', [Validators.required]],
      estadoCivil: ['SOLTERO', [Validators.required]],
      gradoInstruccion: ['SECUNDARIA', [Validators.required]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      telefono: [''],

      // Paso 3: Ubicación
      departamento: ['', [Validators.required]],
      provincia: ['', [Validators.required]],
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
      nombresConyuge: [''],
      apellidoPaConyuge: [''],
      apellidoMatConyuge: [''],
      conyugeTipoDocumento: ['DNI'],
      conyugeNumeroDocumento: [''],
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
        this.solicitudForm.get('nombresConyuge')?.setValidators([Validators.required]);
        this.solicitudForm.get('apellidoPaConyuge')?.setValidators([Validators.required]);
        this.solicitudForm.get('apellidoMatConyuge')?.setValidators([Validators.required]);
        this.solicitudForm.get('conyugeNumeroDocumento')?.setValidators([Validators.required, Validators.minLength(8)]);
      } else {
        this.solicitudForm.get('nombresConyuge')?.clearValidators();
        this.solicitudForm.get('apellidoPaConyuge')?.clearValidators();
        this.solicitudForm.get('apellidoMatConyuge')?.clearValidators();
        this.solicitudForm.get('conyugeNumeroDocumento')?.clearValidators();
      }
      this.solicitudForm.get('nombresConyuge')?.updateValueAndValidity();
      this.solicitudForm.get('apellidoPaConyuge')?.updateValueAndValidity();
      this.solicitudForm.get('apellidoMatConyuge')?.updateValueAndValidity();
      this.solicitudForm.get('conyugeNumeroDocumento')?.updateValueAndValidity();
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

  cargarPerfilCliente(): void {
    this.clienteService.obtenerPerfil().subscribe({
      next: (cliente) => {
        if (cliente) {
          this.solicitudForm.patchValue({
            tipoPersona: cliente.tipoPersona || 'NATURAL',
            tipoDocumento: cliente.tipoDocumento || 'DNI',
            numeroDocumento: cliente.numeroDocumento || '',
            nacionalidad: cliente.nacionalidad || 'PERUANA',
            fechaNacimiento: cliente.fechaNacimiento ? new Date(cliente.fechaNacimiento).toISOString().split('T')[0] : '',
            sexo: cliente.sexo || '',
            estadoCivil: cliente.estadoCivil || 'SOLTERO',
            gradoInstruccion: cliente.gradoInstruccion || 'SECUNDARIA',
            celular: cliente.celular || '',
            telefono: cliente.telefono || '',
            departamento: cliente.departamento || '',
            provincia: cliente.provincia || '',
            distrito: cliente.distrito || '',
            direccion: cliente.direccion || cliente.domicilio || '',
            urbanizacion: cliente.urbanizacion || '',
            manzana: cliente.manzana || '',
            lote: cliente.lote || '',
            codigoPostal: cliente.codigoPostal || '',
            referencia: cliente.referencia || '',
            situacionLaboral: cliente.situacionLaboral || 'DEPENDIENTE',
            cargoOcupacion: cliente.cargoOcupacion || '',
            ingresoBrutoMensual: cliente.ingresoBrutoMensual || cliente.ingresoMensual || 0,
            fechaIngresoLaboral: cliente.fechaIngresoLaboral ? new Date(cliente.fechaIngresoLaboral).toISOString().split('T')[0] : '',
            rucPropio: cliente.rucPropio || '',
            empresa: cliente.empresa || '',
            rucEmpresa: cliente.rucEmpresa || '',
            direccionEmpresa: cliente.direccionEmpresa || '',
            razonSocialJuridica: cliente.empresa || '',
            rucJuridico: cliente.rucEmpresa || ''
          });

          if (cliente.conyuge) {
            this.solicitudForm.patchValue({
              nombresConyuge: cliente.conyuge.nombresConyuge || '',
              apellidoPaConyuge: cliente.conyuge.apellidoPaConyuge || '',
              apellidoMatConyuge: cliente.conyuge.apellidoMatConyuge || '',
              conyugeTipoDocumento: cliente.conyuge.tipoDocumento || 'DNI',
              conyugeNumeroDocumento: cliente.conyuge.numeroDocumento || '',
              conyugeOcupacion: cliente.conyuge.ocupacion || cliente.conyuge.profesion || ''
            });
          }
        }
        // Una vez cargados los datos de BD (si los hay), cargamos el borrador para que el usuario no pierda lo que estaba escribiendo
        this.cargarBorrador();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('No se pudo cargar el perfil del cliente para autocompletar', err);
        // Si hay error, igual cargamos el borrador
        this.cargarBorrador();
        this.cdr.detectChanges();
      }
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
      1: ['tipoPersona', 'tipoCreditoId', 'monedaId', 'montoSolicitado', 'plazoMeses', 'bancoDesembolso', 'cuentaDesembolso'],
      2: ['tipoDocumento', 'numeroDocumento', 'nacionalidad', 'fechaNacimiento', 'sexo', 'estadoCivil', 'gradoInstruccion', 'celular'],
      3: ['distrito', 'direccion', 'referencia'],
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
      1: ['tipoPersona', 'tipoCreditoId', 'monedaId', 'montoSolicitado', 'plazoMeses', 'bancoDesembolso', 'cuentaDesembolso'],
      2: ['tipoDocumento', 'numeroDocumento', 'nacionalidad', 'fechaNacimiento', 'sexo', 'estadoCivil', 'gradoInstruccion', 'celular', 'telefono'],
      3: ['distrito', 'direccion', 'referencia'],
      4: ['situacionLaboral', 'cargoOcupacion', 'ingresoBrutoMensual', 'fechaIngresoLaboral', 'rucPropio', 'empresa', 'rucEmpresa', 'direccionEmpresa', 'razonSocialJuridica', 'rucJuridico', 'representanteLegal'],
      5: ['nombresConyuge', 'apellidoPaConyuge', 'apellidoMatConyuge', 'conyugeNumeroDocumento', 'garanteNombre', 'garanteDni', 'canalEstadoCuenta', 'terminosAceptados']
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
      // Simular cronograma usando FinancieroHelper
      this.cronogramaSimulado = FinancieroHelper.calcularAmortizacionFrancesa(
        montoSolicitado,
        n,
        this.temSeleccionada,
        G
      );

      this.totalInteres = this.cronogramaSimulado.reduce((acc, c) => acc + c.interes, 0);
      this.totalPagar = this.cronogramaSimulado.reduce((acc, c) => acc + c.total, 0);
      
      // Cuota estimada (la primera que no sea gracia)
      const primeraCuotaReal = this.cronogramaSimulado.find(c => c.capital > 0);
      this.cuotaEstimada = primeraCuotaReal ? primeraCuotaReal.total : (this.cronogramaSimulado[0]?.total || 0);
    }
    this.cdr.detectChanges();
  }

  isFieldInvalid(field: string): boolean {
    const f = this.solicitudForm.get(field);
    return !!f && f.invalid && (f.dirty || f.touched);
  }

  abrirModalCronograma() {
    this.calcularCuota(); // Asegurar cálculo fresco
    const modal = document.getElementById('modal_cronograma_solicitante') as HTMLDialogElement;
    if (modal) modal.showModal();
  }

  cerrarModalCronograma() {
    const modal = document.getElementById('modal_cronograma_solicitante') as HTMLDialogElement;
    if (modal) modal.close();
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
      // Loggear qué campos son inválidos para saber por qué no guarda
      const invalidControls = [];
      const controls = this.solicitudForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalidControls.push(name);
        }
      }
      console.warn('El formulario es inválido. Campos con errores:', invalidControls);
      return;
    }

    this.enviando = true;
    this.error = '';

    const solicitud: SolicitudCredito = {
      ...this.solicitudForm.value,
      domicilio: this.solicitudForm.get('direccion')?.value // Sync for compatibility
    };

    // Transformar todos los campos de texto a mayúsculas antes de enviar, excepto el email
    Object.keys(solicitud).forEach(key => {
      const val = (solicitud as any)[key];
      if (typeof val === 'string' && key !== 'email') {
        (solicitud as any)[key] = val.toUpperCase();
      }
    });

    this.creditoService.solicitarCredito(solicitud).subscribe({
      next: (res) => {
        this.exito = true;
        this.enviando = false;
        
        // Limpiar el borrador exitosamente enviado
        localStorage.removeItem(this.DRAFT_KEY);
        
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
