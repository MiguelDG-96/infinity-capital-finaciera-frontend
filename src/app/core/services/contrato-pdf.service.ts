import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { PatrimonioService } from './patrimonio.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Credito } from '../models/credito.model';
import { FinancieroHelper } from '../utils/financiero.helper';

@Injectable({
  providedIn: 'root'
})
export class ContratoPdfService {
  constructor(
      private http: HttpClient,
      private patrimonioService: PatrimonioService
  ) {}

  private readonly TEMPLATE_URL = '/pdf/contrato_template_v2.pdf';

  // Coordenadas portadas del legacy (v5.6)
  private readonly COORDS: any = {
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
        "x": 119,
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

  async generarContrato(credito: Credito, isClienteRecurrente?: boolean): Promise<Blob> {
    const response = await fetch(this.TEMPLATE_URL);
    const templateBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const black = rgb(0, 0, 0);

    // Helpers
    const drawText = (val: any, coordKey: string, isBold = false) => {
      const coord = this.COORDS[coordKey];
      if (!val || !coord) return;
      pages[coord.page].drawText(String(val).toUpperCase(), {
        x: coord.x, y: coord.y - 4,
        size: 9, font: isBold ? fontBold : font, color: black
      });
    };

    const drawCheck = (condition: boolean, coordKey: string) => {
      const coord = this.COORDS[coordKey];
      if (condition && coord) {
        pages[coord.page].drawText('X', {
          x: coord.x - 2.5, y: coord.y - 3.5,
          size: 10, font: fontBold, color: black
        });
      }
    };

    const drawDigits = (val: any, coordKey: string) => {
      const coord = this.COORDS[coordKey];
      if (!val || !coord) return;
      const digits = String(val).replace(/\D/g, '');
      const spacing = coord.spacing || 14;
      const centerX = coord.startX;
      const startOffset = (digits.length - 1) / 2 * spacing;

      for (let i = 0; i < digits.length; i++) {
        const charWidth = font.widthOfTextAtSize(digits[i], 10);
        const x = centerX - startOffset + (i * spacing) - (charWidth / 2) + 0.7;
        pages[coord.page].drawText(digits[i], {
          x: x, y: coord.y - 3,
          size: 10, font: font, color: black
        });
      }
    };

    const cliente: any = (credito.cliente || {});
    // Extraer datosSolicitud si vienen en JSON string
    let extra: any = {};
    if (cliente.datosSolicitud) {
        try { extra = JSON.parse(cliente.datosSolicitud); } catch (e) {}
    }

    // Sobreescribir patrimonio con los datos en vivo si es posible
    if (cliente.id) {
        try {
            const patrimonioLive = await firstValueFrom(this.patrimonioService.obtenerPatrimonio(cliente.id));
            const fm = (val: number | undefined | null) => val != null ? `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '';
            
            const getA = (tipo: string) => fm(patrimonioLive.activos.find(a => a.tipo === tipo)?.valorEstimado);
            extra.activo_auto = getA('AUTO');
            extra.activo_inmueble = getA('INMUEBLE');
            extra.activo_ahorros = getA('AHORROS');
            extra.activo_plazofijo = getA('PLAZO_FIJO');
            extra.activo_otros = getA('OTRO');
            extra.total_activos = fm(patrimonioLive.totalActivos);
            extra.patrimonio_neto = fm(patrimonioLive.patrimonioNeto);
            extra.total_pasivos = fm(patrimonioLive.totalPasivos);

            const findP = (tipo: string) => patrimonioLive.pasivos.find(p => p.tipo === tipo);
            const pT = findP('TARJETAS');
            extra.pasivo_tarjetas = fm(pT?.montoPendiente);
            extra.pasivo_tarjetas_cuota = fm(pT?.cuotaMensual);
            extra.pasivo_tarjetas_vencimiento = pT?.vencimiento || '';

            const pCP = findP('CORTO_PLAZO');
            extra.pasivo_cortoplazo = fm(pCP?.montoPendiente);
            extra.pasivo_cortoplazo_cuota = fm(pCP?.cuotaMensual);
            extra.pasivo_cortoplazo_vencimiento = pCP?.vencimiento || '';

            const pLP = findP('LARGO_PLAZO');
            extra.pasivo_largoplazo = fm(pLP?.montoPendiente);
            extra.pasivo_largoplazo_cuota = fm(pLP?.cuotaMensual);
            extra.pasivo_largoplazo_vencimiento = pLP?.vencimiento || '';

            const pHIP = findP('HIPOTECARIO');
            extra.pasivo_hipotecario = fm(pHIP?.montoPendiente);
            extra.pasivo_hipotecario_cuota = fm(pHIP?.cuotaMensual);
            extra.pasivo_hipotecario_vencimiento = pHIP?.vencimiento || '';

            const pOTR = findP('OTRO');
            extra.pasivo_otros = fm(pOTR?.montoPendiente);
            extra.pasivo_otros_cuota = fm(pOTR?.cuotaMensual);
            extra.pasivo_otros_vencimiento = pOTR?.vencimiento || '';
        } catch (e) {
            console.error('Error obteniendo patrimonio live para contrato PDF:', e);
        }
    }

    // 1. Identidad
    drawCheck(cliente.tipoDocumento === 'DNI' || !cliente.tipoDocumento, 'dni_check');
    drawDigits(cliente.numeroDocumento, 'dni_digits');
    
    // Nombres extraídos del JSON o fallback al nombreCompleto del usuario
    const nombreFallback = cliente.usuario?.nombreCompleto || '';
    drawText(extra.nombres || nombreFallback.split(' ')[0] || '--', 'nombres');
    drawText(extra.apellidoPaterno || nombreFallback.split(' ').slice(1).join(' ') || '--', 'apellido_paterno', true);
    if (extra.apellidoMaterno) {
        drawText(extra.apellidoMaterno, 'apellido_materno', true);
    }
    
    drawText(extra.nacionalidad || 'PERUANA', 'nacionalidad');
    
    // Fechas
    const formatDate = (dateStr: any) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`;
    };
    drawDigits(formatDate(credito.fechaSolicitud), 'fecha_solicitud_digits');
    drawDigits(formatDate(cliente.fechaNacimiento), 'fecha_nacimiento_digits');
    
    // Check de sexo
    const sexoStr = String(cliente.sexo || extra.sexo || '').toLowerCase().trim();
    if (sexoStr === 'f' || sexoStr === 'femenino' || sexoStr === 'mujer') {
        drawCheck(true, 'check_sexo_f');
    } else if (sexoStr === 'm' || sexoStr === 'masculino' || sexoStr === 'hombre') {
        drawCheck(true, 'check_sexo_m');
    }

    // Estado Civil
    const estadoCivilStr = String(cliente.estadoCivil || extra.estadoCivil || '').toLowerCase().trim();
    if (estadoCivilStr.includes('soltero')) {
        drawCheck(true, 'check_soltero');
    } else if (estadoCivilStr.includes('casado')) {
        drawCheck(true, 'check_casado');
    } else if (estadoCivilStr.includes('viudo')) {
        drawCheck(true, 'check_viudo');
    } else if (estadoCivilStr.includes('divorciado')) {
        drawCheck(true, 'check_divorciado');
    }

    // Datos de Contacto
    drawText(cliente.telefono || extra.telefono, 'telefono');
    drawText(cliente.celular || extra.celular, 'celular');
    drawText(extra.correo || extra.email || (cliente as any).email || (cliente as any).correo, 'correo_electronico');

    // Cliente Exclusivo
    if (isClienteRecurrente !== undefined) {
        if (isClienteRecurrente) {
            drawCheck(true, 'check_exclusivo_si');
        } else {
            drawCheck(true, 'check_exclusivo_no');
        }
    }

    // Check Moneda
    const monedaStr = String(credito.moneda || '').toLowerCase().trim();
    const simboloStr = String(credito.simboloMoneda || '').trim();
    if (monedaStr.includes('sol') || simboloStr === 'S/') {
        drawCheck(true, 'check_moneda_soles');
    } else if (monedaStr.includes('dolar') || monedaStr.includes('dólar') || simboloStr === '$') {
        drawCheck(true, 'check_moneda_dolares');
    }

    // 2. Ubicación
    drawText(cliente.departamento || extra.departamento, 'departamento');
    drawText(cliente.provincia || extra.provincia, 'provincia');
    drawText(cliente.distrito || extra.distrito, 'distrito');
    drawText(cliente.direccion || extra.direccion || cliente.domicilio, 'direccion');
    drawText(cliente.urbanizacion || extra.urbanizacion, 'urbanizacion');
    drawText(cliente.manzana || extra.manzana || extra.mz, 'manzana');
    drawText(cliente.lote || extra.lote || extra.lt, 'lote');
    drawText(cliente.codigoPostal || extra.codigoPostal || extra.codigo_postal, 'codigo_postal');

    // Situación Laboral
    const sitLabStr = String(cliente.situacionLaboral || extra.situacionLaboral || '').toLowerCase().trim();
    if (sitLabStr.includes('independiente')) {
        drawCheck(true, 'check_independiente');
    } else if (sitLabStr.includes('dependiente')) {
        drawCheck(true, 'check_dependiente');
    }

    drawText(cliente.empresa || extra.empresa, 'empresa');
    drawText(cliente.cargoOcupacion || extra.cargoOcupacion, 'cargo_ocupacion');
    drawText(cliente.ingresoMensual ? cliente.ingresoMensual.toString() : extra.ingresoMensual, 'ingreso_mensual');
    drawText(cliente.ingresoBrutoMensual ? cliente.ingresoBrutoMensual.toString() : extra.ingresoBrutoMensual, 'ingreso_bruto_mensual');
    drawDigits(cliente.rucEmpresa || extra.rucEmpresa, 'ruc_empresa_digits');
    drawDigits(cliente.rucPropio || extra.rucPropio, 'ruc_propio_digits');
    drawText(cliente.telefonoEmpresa || extra.telefonoEmpresa, 'telefono_empresa');
    
    const fIngreso = cliente.fechaIngresoLaboral || extra.fechaIngresoLaboral;
    if (fIngreso) {
        const d = new Date(fIngreso);
        if (!isNaN(d.getTime())) {
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yy = String(d.getFullYear()).slice(-2);
            drawDigits(`${mm}${yy}`, 'fecha_ingreso_laboral_digits');
        } else {
            drawDigits(fIngreso, 'fecha_ingreso_laboral_digits');
        }
    }
    
    drawText(cliente.direccionEmpresa || extra.direccionEmpresa, 'direccion_empresa');

    // Cónyuge
    if (cliente.conyuge) {
        drawText(cliente.conyuge.nombresConyuge, 'nombres_conyuge');
        drawText(cliente.conyuge.apellidoPaConyuge, 'apellido_pa_conyuge');
        drawText(cliente.conyuge.apellidoMatConyuge, 'apellido_mat_conyuge');
        if (cliente.conyuge?.numeroDocumento) {
            drawDigits(cliente.conyuge.numeroDocumento, 'conyuge_dni_digits');
            
            if (cliente.conyuge.tipoDocumento === 'DNI') {
                drawCheck(true, 'check_dni_conyuge');
            } else if (cliente.conyuge.tipoDocumento === 'CE') {
                drawCheck(true, 'check_carnet_conyuge');
            }
        }
        drawText(cliente.conyuge.ocupacion, 'conyuge_ocupacion');
        drawText(cliente.conyuge.ingresosMensuales ? cliente.conyuge.ingresosMensuales.toString() : '', 'conyuge_ingreso_mensual');
        drawText(cliente.conyuge.telefono, 'conyuge_telefono');
        drawText(cliente.conyuge.nacionalidad, 'conyuge_nacionalidad');
    } else {
        drawText(extra.nombresConyuge || extra.nombres_conyuge, 'nombres_conyuge');
        drawText(extra.apellidoPaConyuge || extra.apellido_pa_conyuge, 'apellido_pa_conyuge');
        drawText(extra.apellidoMatConyuge || extra.apellido_mat_conyuge, 'apellido_mat_conyuge');
        drawDigits(extra.conyuge_dni || extra.dniConyuge, 'conyuge_dni_digits');
        drawText(extra.conyuge_ocupacion || extra.ocupacionConyuge, 'conyuge_ocupacion');
        drawText(extra.conyuge_ingreso_mensual || extra.ingresosConyuge, 'conyuge_ingreso_mensual');
        drawText(extra.conyuge_telefono || extra.telefonoConyuge, 'conyuge_telefono');
        drawText(extra.conyuge_nacionalidad || extra.nacionalidadConyuge, 'conyuge_nacionalidad');
    }

    // Patrimonio (Extraídos de JSON dinámico)
    drawText(extra.activo_auto || extra.activoAuto || '', 'activo_auto');
    drawText(extra.activo_inmueble || extra.activoInmueble || '', 'activo_inmueble');
    drawText(extra.activo_ahorros || extra.activoAhorros || '', 'activo_ahorros');
    drawText(extra.activo_plazofijo || extra.activoPlazofijo || '', 'activo_plazofijo');
    drawText(extra.activo_otros || extra.activoOtros || '', 'activo_otros');
    drawText(extra.total_activos || extra.totalActivos || '', 'total_activos');

    drawText(extra.pasivo_tarjetas || extra.pasivoTarjetas || '', 'pasivo_tarjetas');
    drawText(extra.pasivo_tarjetas_cuota || extra.pasivoTarjetasCuota || '', 'pasivo_tarjetas_cuota');
    drawText(extra.pasivo_tarjetas_vencimiento || extra.pasivoTarjetasVencimiento || '', 'pasivo_tarjetas_vencimiento');

    drawText(extra.pasivo_cortoplazo || extra.pasivoCortoplazo || '', 'pasivo_cortoplazo');
    drawText(extra.pasivo_cortoplazo_cuota || extra.pasivoCortoplazoCuota || '', 'pasivo_cortoplazo_cuota');
    drawText(extra.pasivo_cortoplazo_vencimiento || extra.pasivoCortoplazoVencimiento || '', 'pasivo_cortoplazo_vencimiento');

    drawText(extra.pasivo_largoplazo || extra.pasivoLargoplazo || '', 'pasivo_largoplazo');
    drawText(extra.pasivo_largoplazo_cuota || extra.pasivoLargoplazoCuota || '', 'pasivo_largoplazo_cuota');
    drawText(extra.pasivo_largoplazo_vencimiento || extra.pasivoLargoplazoVencimiento || '', 'pasivo_largoplazo_vencimiento');

    drawText(extra.pasivo_hipotecario || extra.pasivoHipotecario || '', 'pasivo_hipotecario');
    drawText(extra.pasivo_hipotecario_cuota || extra.pasivoHipotecarioCuota || '', 'pasivo_hipotecario_cuota');
    drawText(extra.pasivo_hipotecario_vencimiento || extra.pasivoHipotecarioVencimiento || '', 'pasivo_hipotecario_vencimiento');

    drawText(extra.pasivo_otros || extra.pasivoOtros || '', 'pasivo_otros');
    drawText(extra.pasivo_otros_cuota || extra.pasivoOtrosCuota || '', 'pasivo_otros_cuota');
    drawText(extra.pasivo_otros_vencimiento || extra.pasivoOtrosVencimiento || '', 'pasivo_otros_vencimiento');

    drawText(extra.total_pasivos || extra.totalPasivos || '', 'total_pasivos');

    drawText(extra.patrimonio_neto || extra.patrimonioNeto || '', 'patrimonio_neto');

    // 3. Crédito
    // (Recuadro Negocio fue agregado directamente a la plantilla física)

    const tipoLower = (credito.tipoCredito || '').toLowerCase();
    drawCheck(tipoLower.includes('estudio'), 'check_estudios');
    drawCheck(tipoLower.includes('negocio') || tipoLower.includes('mype'), 'check_negocio');
    drawCheck(tipoLower.includes('personal') || tipoLower.includes('consumo') || tipoLower.includes('efectivo'), 'check_personal');
    drawCheck(tipoLower.includes('vehicular') || tipoLower.includes('auto'), 'check_vehicular');
    drawCheck(tipoLower.includes('hipotecario'), 'check_hipotecario');
    drawCheck(tipoLower.includes('empresarial') || tipoLower.includes('empresa'), 'check_empresarial');

    drawText(`${credito.tasaAprobada || credito.tem || 0}%`, 'tasa', true);
    drawText(`${credito.plazoMeses} meses`, 'plazo_meses');
    drawText(cliente.usuario?.email || '--', 'correo_envio');
    drawDigits(credito.cuentaDesembolso || '--', 'cuenta_abono_digits');
    
    // Calificación
    drawText(`S/ ${credito.montoAprobado || credito.montoCredito || ''}`, 'monto_solicitado', true);
    // calcular cuota si no hay
    let cuotaMs = '--';
    if (credito.montoAprobado && credito.plazoMeses) {
        const temAplicado = credito.tasaAprobada || credito.tem || 0;
        const cuota = (credito.montoAprobado * (temAplicado/100)) / (1 - Math.pow(1 + (temAplicado/100), -credito.plazoMeses));
        cuotaMs = `S/ ${cuota.toFixed(2)}`;
    }
    drawText(cuotaMs, 'cuota_mensual', true);

    // Firmas (Página 9 / índice 8)
    const firmaNombreFallback = cliente.usuario?.nombreCompleto || extra.nombres || '';
    drawText(firmaNombreFallback, 'firma_titular_nombre');
    drawText(`${cliente.tipoDocumento} ${cliente.numeroDocumento}`, 'firma_titular_doc');
    
    if (cliente.conyuge) {
        drawText(`${cliente.conyuge.nombresConyuge} ${cliente.conyuge.apellidoPaConyuge} ${cliente.conyuge.apellidoMatConyuge}`, 'firma_conyuge_nombre');
        drawText(`${cliente.conyuge.tipoDocumento || 'DNI'} ${cliente.conyuge.numeroDocumento}`, 'firma_conyuge_doc');
    } else if (extra.nombres_conyuge || extra.nombresConyuge) {
        drawText(`${extra.nombres_conyuge || extra.nombresConyuge} ${extra.apellido_pa_conyuge || extra.apellidoPaConyuge} ${extra.apellido_mat_conyuge || extra.apellidoMatConyuge}`, 'firma_conyuge_nombre');
        drawText(`DNI ${extra.conyuge_dni || extra.dniConyuge}`, 'firma_conyuge_doc');
    }

    // Para el representante, por ahora imprimimos un placeholder o lo dejamos estático
    // drawText('Representante Infinity', 'firma_infiny_representante');

    // Eliminar la página 10 de la plantilla original (índice 9)
    try {
        pdfDoc.removePage(9);
    } catch (e) {
        console.warn('No se pudo eliminar la página 10, es posible que el PDF no tenga tantas hojas.');
    }

    // 4. Cronograma Detallado (Página Nueva)
    const pCronograma = pdfDoc.addPage([595, 842]);
    this.drawFullCronograma(pCronograma, cliente, credito, font, fontBold);

    // 5. Anexo con Datos Completos del Formulario (Página Nueva)
    const pAnexo = pdfDoc.addPage([595, 842]);
    this.drawAnexoDatos(pAnexo, cliente, credito, extra, font, fontBold);

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  }

  private drawAnexoDatos(page: any, cliente: any, credito: any, extra: any, font: any, fontBold: any) {
    const headT = 780;
    const rowH = 20;
    const marginL = 50;
    
    page.drawText("ANEXO: DECLARACIÓN JURADA DE DATOS DEL CLIENTE", { x: marginL, y: headT, size: 14, font: fontBold });
    page.drawText(`Documento generado el: ${new Date().toLocaleDateString('es-PE')}`, { x: marginL, y: headT - 20, size: 10, font });
    
    let curY = headT - 50;

    const drawSection = (title: string, data: Record<string, any>) => {
        if (curY < 100) {
            // No implementamos paginación compleja en este anexo, pero dejamos un margen.
        }
        page.drawRectangle({ x: marginL, y: curY - 12, width: 495, height: 16, color: rgb(0.9, 0.9, 0.9) });
        page.drawText(title.toUpperCase(), { x: marginL + 5, y: curY - 8, size: 10, font: fontBold });
        curY -= rowH;

        Object.entries(data).forEach(([key, val]) => {
            if (val === undefined || val === null || val === '') return;
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            page.drawText(`${label}:`, { x: marginL + 10, y: curY, size: 9, font: fontBold });
            page.drawText(String(val).toUpperCase(), { x: marginL + 150, y: curY, size: 9, font });
            page.drawLine({
                start: { x: marginL, y: curY - 5 },
                end: { x: marginL + 495, y: curY - 5 },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8)
            });
            curY -= rowH;
        });
        curY -= 10;
    };

    drawSection("1. Datos Personales", {
        "Nombres": extra.nombres || cliente.usuario?.nombreCompleto?.split(' ')[0],
        "Apellido Paterno": extra.apellidoPaterno || cliente.usuario?.nombreCompleto?.split(' ').slice(1).join(' '),
        "Apellido Materno": extra.apellidoMaterno,
        "Tipo Documento": cliente.tipoDocumento,
        "Numero Documento": cliente.numeroDocumento,
        "Nacionalidad": extra.nacionalidad,
        "Estado Civil": cliente.estadoCivil || extra.estadoCivil,
        "Grado Instruccion": extra.gradoInstruccion,
        "Fecha Nacimiento": cliente.fechaNacimiento,
        "Email": cliente.usuario?.email,
        "Celular": cliente.celular || extra.celular
    });

    drawSection("2. Domicilio y Ubicación", {
        "Departamento": cliente.departamento || extra.departamento,
        "Provincia": cliente.provincia || extra.provincia,
        "Distrito": cliente.distrito || extra.distrito,
        "Dirección Completa": cliente.domicilio || extra.direccion,
        "Referencia": cliente.referencia || extra.referencia
    });

    drawSection("3. Situación Laboral", {
        "Empresa": cliente.empresa || extra.empresa,
        "Cargo / Ocupacion": cliente.cargoOcupacion || extra.cargoOcupacion,
        "Ingreso Mensual (S/)": cliente.ingresoMensual || extra.ingresoMensual,
        "RUC Empresa": cliente.rucEmpresa || extra.rucEmpresa,
        "Direccion Empresa": cliente.direccionEmpresa || extra.direccionEmpresa
    });

    drawSection("4. Condiciones del Crédito", {
        "Monto Solicitado": `S/ ${credito.montoAprobado || credito.montoCredito}`,
        "Plazo (Meses)": credito.plazoMeses,
        "Tasa Efectiva Mensual": `${credito.tasaAprobada || credito.tem}%`,
        "Periodo de Gracia (Meses)": credito.periodoGracia
    });

    // Firmas
    curY -= 60;
    page.drawLine({ start: { x: 100, y: curY }, end: { x: 250, y: curY }, thickness: 1, color: rgb(0,0,0) });
    page.drawText("FIRMA DEL CLIENTE", { x: 130, y: curY - 15, size: 9, font: fontBold });
    page.drawText(`DNI: ${cliente.numeroDocumento || ''}`, { x: 145, y: curY - 28, size: 9, font });
  }

  private drawFullCronograma(page: any, cliente: any, data: Credito, font: any, fontBold: any) {
    const PAGE_WIDTH = 595;
    const headT = 780;
    const tabT = 670;
    const rowH = 18;
    const cols = [40, 80, 40, 65, 65, 55, 55, 75]; // suma = 475
    const TABLE_WIDTH = cols.reduce((a: number, b: number) => a + b, 0);
    const tableX = (PAGE_WIDTH - TABLE_WIDTH) / 2; // centrado horizontal
    const headers = ["Cuota", "Vencimiento", "Días", "Capital", "Interés", "Comis.", "Seguros", "Cuota Mensual"];

    // Datos Financieros
    const cuotas = FinancieroHelper.calcularAmortizacionFrancesa(
        data.montoAprobado || data.montoCredito || 0,
        data.plazoMeses || 12,
        data.tasaAprobada || data.tem || 5,
        data.periodoGracia || 0
    );

    // Colores corporativos (Rojo)
    const colorPrimario = rgb(0.8, 0.1, 0.1);
    const colorTextoHeader = rgb(1, 1, 1);
    const colorFilaZebra = rgb(0.96, 0.97, 0.98);
    const colorBorde = rgb(0.85, 0.85, 0.85);

    // Título centrado en la página
    const titleText = "CRONOGRAMA DE PAGOS";
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 18);
    page.drawText(titleText, { x: (PAGE_WIDTH - titleWidth) / 2, y: headT, size: 18, font: fontBold, color: colorPrimario });
    page.drawLine({ start: { x: tableX, y: headT - 5 }, end: { x: tableX + TABLE_WIDTH, y: headT - 5 }, thickness: 2, color: colorPrimario });

    // Datos del Cliente y Crédito (dos columnas alineadas a la tabla)
    const infoY = headT - 25;
    const col2X = tableX + TABLE_WIDTH / 2;
    const nombreCliente = cliente.usuario?.nombreCompleto || `${cliente.nombres} ${cliente.apellidoPaterno}`;
    page.drawText(`Cliente: ${nombreCliente}`, { x: tableX, y: infoY, size: 9, font: fontBold });
    page.drawText(`Documento: ${cliente.numeroDocumento}`, { x: tableX, y: infoY - 15, size: 9, font });
    page.drawText(`Monto: S/ ${(data.montoAprobado || data.montoCredito || 0).toLocaleString('es-PE')}`, { x: col2X, y: infoY, size: 9, font: fontBold });
    page.drawText(`Plazo: ${data.plazoMeses} meses`, { x: col2X, y: infoY - 15, size: 9, font });
    page.drawText(`Tasa (TEM): ${data.tasaAprobada || data.tem}%`, { x: col2X + 120, y: infoY, size: 9, font });
    page.drawText(`Moneda: Soles (S/)`, { x: col2X + 120, y: infoY - 15, size: 9, font });

    // Cabecera Tabla — texto centrado dentro de cada columna
    page.drawRectangle({ x: tableX, y: tabT, width: TABLE_WIDTH, height: rowH + 4, color: colorPrimario });
    let curX = tableX;
    headers.forEach((h, idx) => {
        const hText = h.toUpperCase();
        const hWidth = fontBold.widthOfTextAtSize(hText, 7);
        const hX = curX + (cols[idx] - hWidth) / 2;
        page.drawText(hText, { x: hX, y: tabT + 7, size: 7, font: fontBold, color: colorTextoHeader });
        curX += cols[idx];
    });

    // Filas — contenido centrado dentro de cada celda
    cuotas.forEach((c: any, idx: number) => {
        const y = tabT - ((idx + 1) * rowH);

        // Zebra striping
        if (idx % 2 === 0) {
            page.drawRectangle({ x: tableX, y, width: TABLE_WIDTH, height: rowH, color: colorFilaZebra });
        }

        // Bordes de celda
        page.drawRectangle({ x: tableX, y, width: TABLE_WIDTH, height: rowH, borderWidth: 0.5, borderColor: colorBorde });

        let rX = tableX;
        const rowData = [
            String(c.numero),
            c.fecha.toLocaleDateString('es-PE'),
            "30",
            `S/ ${c.capital.toFixed(2)}`,
            `S/ ${c.interes.toFixed(2)}`,
            "S/ 0.00",
            "S/ 0.00",
            `S/ ${c.total.toFixed(2)}`
        ];

        rowData.forEach((val: string, j: number) => {
            const isImporte = j === 7;
            const fontToUse = isImporte ? fontBold : font;
            const textWidth = fontToUse.widthOfTextAtSize(val, 8);
            const tX = rX + (cols[j] - textWidth) / 2; // centrado horizontal dentro de la celda
            page.drawText(val, { x: tX, y: y + 5, size: 8, font: fontToUse });
            rX += cols[j];
        });
    });

    // Resumen Total al final de la tabla (alineado al borde derecho de la tabla)
    const totalY = tabT - (cuotas.length * rowH) - 25;
    const totalMonto = cuotas.reduce((acc: number, c: any) => acc + c.total, 0);
    const totalBoxW = 170;
    const totalBoxX = tableX + TABLE_WIDTH - totalBoxW;
    page.drawRectangle({ x: totalBoxX, y: totalY, width: totalBoxW, height: 20, color: rgb(0.9, 0.9, 0.9), borderColor: colorBorde, borderWidth: 1 });
    page.drawText("TOTAL A PAGAR:", { x: totalBoxX + 5, y: totalY + 6, size: 8, font: fontBold });
    page.drawText(`S/ ${totalMonto.toFixed(2)}`, { x: totalBoxX + 95, y: totalY + 6, size: 9, font: fontBold, color: colorPrimario });

    // Mensaje de pagos
    let msgY = totalY - 40;
    page.drawText("Datos para efectuar los pagos", { x: tableX, y: msgY, size: 10, font: fontBold });
    msgY -= 15;
    page.drawText("El cliente deberá realizar los abonos correspondientes del crédito a la siguiente cuenta bancaria o medio autorizado:", { x: tableX, y: msgY, size: 8, font: font });
    msgY -= 15;
    page.drawText("Entidad financiera: INFINYCAPITAL Financiera", { x: tableX, y: msgY, size: 8, font: fontBold });
    msgY -= 12;
    page.drawText("Banco: BCP - Banco de Crédito del Perú", { x: tableX, y: msgY, size: 8, font: font });
    msgY -= 12;
    page.drawText("N.º de cuenta: 4357231801032", { x: tableX, y: msgY, size: 8, font: font });
    msgY -= 12;
    page.drawText("CCI: 00243500723180103268", { x: tableX, y: msgY, size: 8, font: font });
    msgY -= 12;
    page.drawText("Pago por Yape: 954 862 745", { x: tableX, y: msgY, size: 8, font: font });
    msgY -= 15;
    page.drawText("Se considerará válido el pago únicamente cuando el comprobante sea remitido y verificado por INFINYCAPITAL Financiera.", { x: tableX, y: msgY, size: 8, font: fontBold });
  }

  async descargarPDF(credito: Credito, isClienteRecurrente?: boolean) {
    const blob = await this.generarContrato(credito, isClienteRecurrente);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contrato_#${credito.id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
