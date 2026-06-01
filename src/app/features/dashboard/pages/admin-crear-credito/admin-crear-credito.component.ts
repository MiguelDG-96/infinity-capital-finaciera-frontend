// src/app/features/dashboard/pages/admin-crear-credito/admin-crear-credito.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CreditoService } from '../../../../core/services/credito.service';
import { FinancieroHelper, CuotaSimulada } from '../../../../core/utils/financiero.helper';

@Component({
  selector: 'app-admin-crear-credito',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './admin-crear-credito.component.html',
  styles: [`
    input[type="text"] { text-transform: uppercase; }
  `]
})
export class AdminCrearCreditoComponent implements OnInit {
  formulario!: FormGroup;
  cargando = false;
  tiposCredito: any[] = [];
  monedas: any[] = [];
  
  // Variables para la simulación del cronograma
  tasaSimulada: number = 0;
  cuotasSimuladas: CuotaSimulada[] = [];
  montoTotalSimulado: number = 0;
  interesTotalSimulado: number = 0;
  
  exito = false;
  mensajeExito = '';
  
  errorToast = false;
  mensajeErrorToast = '';
  
  private readonly DRAFT_KEY = 'draft_admin_crear_credito';

  constructor(
    private fb: FormBuilder,
    private creditoService: CreditoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initForm();
    this.cargarCatalogos();
    this.cargarBorrador();
    
    // Autoguardado al cambiar valores
    this.formulario.valueChanges.subscribe(val => {
      this.guardarBorrador(val);
    });
  }

  private guardarBorrador(data: any) {
    try {
      localStorage.setItem(this.DRAFT_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Error guardando borrador', e);
    }
  }

  private cargarBorrador() {
    try {
      const draft = localStorage.getItem(this.DRAFT_KEY);
      if (draft) {
        this.formulario.patchValue(JSON.parse(draft), { emitEvent: false });
      }
    } catch (e) {
      console.warn('Error leyendo borrador', e);
    }
  }

  limpiarFormulario() {
    if (confirm('¿Estás seguro de vaciar el formulario? Se perderán los datos ingresados.')) {
      this.formulario.reset({
        tipoPersona: 'NATURAL',
        tipoDocumento: 'DNI',
        plazoMeses: 12,
        monedaId: 1,
        periodoGracia: 0,
        numeroDependientes: 0,
        situacionLaboral: 'DEPENDIENTE',
        canalEstadoCuenta: 'EMAIL',
        desembolsarAutomaticamente: false,
        fechaDesembolso: '',
        exentoMoraAutomatica: false
      });
      localStorage.removeItem(this.DRAFT_KEY);
    }
  }

  initForm() {
    this.formulario = this.fb.group({
      // 1. Datos Personales
      tipoPersona: ['NATURAL', Validators.required],
      tipoDocumento: ['DNI', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.minLength(8), Validators.pattern('^[0-9]+$')]],
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: [''],
      email: [''],
      fechaNacimiento: [''],
      celular: ['', [Validators.pattern('^[0-9]+$')]],
      telefono: [''],
      nacionalidad: ['PERUANA'],
      estadoCivil: ['SOLTERO'],
      gradoInstruccion: ['SECUNDARIA'],
      numeroDependientes: [0],

      // Condicional Jurídica
      razonSocialJuridica: [''],
      rucJuridico: [''],
      representanteLegal: [''],

      // 2. Ubicación
      departamento: [''],
      provincia: [''],
      distrito: [''],
      direccion: [''],
      urbanizacion: [''],
      manzana: [''],
      lote: [''],
      codigoPostal: [''],
      referencia: [''],

      // 3. Laboral
      situacionLaboral: ['DEPENDIENTE'],
      empresa: [''],
      cargoOcupacion: [''],
      ingresoMensual: [null],
      ingresoBrutoMensual: [null],
      fechaIngresoLaboral: [''],
      rucPropio: [''],
      rucEmpresa: [''],
      direccionEmpresa: [''],

      // 4. Cónyuge y Garante
      nombresConyuge: [''],
      apellidoPaConyuge: [''],
      apellidoMatConyuge: [''],
      conyugeTipoDocumento: ['DNI'],
      conyugeNumeroDocumento: [''],
      conyugeOcupacion: [''],
      
      garanteNombre: [''],
      garanteDni: [''],
      garanteTelefono: [''],

      // 5. Crédito
      montoSolicitado: [null, [Validators.required, Validators.min(100)]],
      plazoMeses: [12, [Validators.required, Validators.min(1)]],
      tipoCreditoId: ['', Validators.required],
      monedaId: [1, Validators.required], // Asumiendo PEN por defecto
      periodoGracia: [0],
      bancoDesembolso: [''],
      cuentaDesembolso: ['', [Validators.pattern('^[0-9]+$')]],
      canalEstadoCuenta: ['EMAIL'],
      desembolsarAutomaticamente: [false],
      descuentoRetencion: [0],
      fechaDesembolso: [''],
      exentoMoraAutomatica: [false]
    });
  }

  soloNumeros(event: any, controlName: string) {
    const inputValue = event.target.value;
    const numericValue = inputValue.replace(/[^0-9]/g, '');
    if (inputValue !== numericValue) {
      this.formulario.get(controlName)?.setValue(numericValue, { emitEvent: false });
    }
  }

  cargarCatalogos() {
    this.creditoService.obtenerTiposCreditoActivos().subscribe({
      next: (res) => {
        this.tiposCredito = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando tipos', err)
    });
    this.creditoService.obtenerMonedasActivas().subscribe({
      next: (res) => {
        this.monedas = res;
        if(res.length > 0) {
          this.formulario.patchValue({ monedaId: res[0].id }, { emitEvent: false });
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando monedas', err)
    });
  }

  abrirModalCronograma() {
    const vals = this.formulario.value;
    if (!vals.montoSolicitado || !vals.plazoMeses || !vals.tipoCreditoId) {
      alert('Debe ingresar el monto, el plazo y seleccionar el tipo de crédito primero.');
      return;
    }

    const tipoId = parseInt(vals.tipoCreditoId, 10);
    const tipo = this.tiposCredito.find(t => t.id === tipoId);
    
    // Asignar tasa simulada (si no hay tipo, se usa 0)
    // Asumiremos que el tipo de crédito tiene un arreglo de rangos o una tasa general.
    // Buscaremos la tasa que aplique al monto, o usaremos la tasa base.
    this.tasaSimulada = 0;
    if (tipo) {
      if (tipo.rangos && tipo.rangos.length > 0) {
        const rango = tipo.rangos.find((r: any) => vals.montoSolicitado >= r.montoMinimo && vals.montoSolicitado <= r.montoMaximo);
        this.tasaSimulada = rango ? rango.tasaMensual : tipo.rangos[0].tasaMensual;
      } else {
        // En caso de que haya una tasa global en el tipo
        this.tasaSimulada = tipo.tasaMensual || 0;
      }
    }

    this.cuotasSimuladas = FinancieroHelper.calcularAmortizacionFrancesa(
      vals.montoSolicitado,
      vals.plazoMeses,
      this.tasaSimulada,
      vals.periodoGracia || 0,
      vals.fechaDesembolso ? new Date(vals.fechaDesembolso + 'T00:00:00') : undefined
    );

    this.montoTotalSimulado = this.cuotasSimuladas.reduce((acc, c) => acc + c.total, 0);
    this.interesTotalSimulado = this.cuotasSimuladas.reduce((acc, c) => acc + c.interes, 0);

    const modal = document.getElementById('modal_cronograma') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  cerrarModal() {
    const modal = document.getElementById('modal_cronograma') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
  }

  onSubmit() {
    this.errorToast = false; // Reset error toast

    if (this.formulario.invalid) {
      Object.keys(this.formulario.controls).forEach(key => {
        this.formulario.get(key)?.markAsTouched();
      });
      this.mostrarError('Por favor complete todos los campos obligatorios correctamente.');
      return;
    }

    this.cargando = true;
    const req = this.formulario.value;
    
    // Parse numeric values
    if (req.tipoCreditoId) req.tipoCreditoId = parseInt(req.tipoCreditoId, 10);
    if (req.monedaId) req.monedaId = parseInt(req.monedaId, 10);
    
    // Sincronizar domicilio para compatibilidad con backend
    if (req.direccion) req.domicilio = req.direccion;

    // Transformar todos los campos de texto a mayúsculas antes de enviar, excepto el email
    Object.keys(req).forEach(key => {
      if (typeof req[key] === 'string' && key !== 'email') {
        req[key] = req[key].toUpperCase();
      }
    });

    this.creditoService.crearCreditoDirecto(req).subscribe({
      next: (res) => {
        this.cargando = false;
        this.exito = true;
        this.mensajeExito = res.mensaje || 'Crédito registrado con éxito';
        localStorage.removeItem(this.DRAFT_KEY);
        
        // Redirigir después de mostrar el mensaje de éxito
        setTimeout(() => {
          this.router.navigate(['/dashboard/admin/cartera']);
        }, 2500);
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al registrar', err);
        this.mostrarError('Hubo un error al registrar el crédito: ' + (err.error?.message || err.error?.error || err.message));
      }
    });
  }

  private mostrarError(mensaje: string) {
    this.mensajeErrorToast = mensaje;
    this.errorToast = true;
    setTimeout(() => {
      this.errorToast = false;
    }, 5000);
  }
}
