export interface ProductSubItem {
  label: string;
  isNew?: boolean;
}

export interface ProductUpdated {
  category: string;
  icon: string;
  subItems: ProductSubItem[];
}

export const PRODUCTS_DATA: ProductUpdated[] = [
  {
    category: 'Cuentas',
    icon: 'piggy-bank',
    subItems: [
      { label: 'Cuenta Contigo: Retiro AFP', isNew: true },
      { label: 'Cuenta Digital' },
      { label: 'Cuenta Premio' },
      { label: 'Cuenta Sueldo' },
      { label: 'Cuenta Ilimitada' },
      { label: 'Wardaditos' },
      { label: 'Cuenta CTS' }
    ]
  },
  {
    category: 'Tarjetas',
    icon: 'credit-card',
    subItems: [
      { label: 'Tarjeta de Crédito Gold' },
      { label: 'Tarjeta de Crédito Platinum' },
      { label: 'Tarjeta de Débito' }
    ]
  },
  {
    category: 'Préstamos',
    icon: 'banknote',
    subItems: [
      { label: 'Préstamo Personal' },
      { label: 'Préstamo Vehicular' },
      { label: 'Adelanto de Sueldo' }
    ]
  },
  {
    category: 'Seguros',
    icon: 'shield',
    subItems: [
      { label: 'Seguro de Vida' },
      { label: 'Seguro Vehicular' },
      { label: 'Seguro de Salud' }
    ]
  },
  {
    category: 'Inversiones',
    icon: 'bar-chart-3',
    subItems: [
      { label: 'Depósito a Plazo Fijo' },
      { label: 'Fondos Mutuos' },
      { label: 'Bolsa de Valores' }
    ]
  },
  {
    category: 'Tipo de cambio',
    icon: 'refresh-cw',
    subItems: [
      { label: 'Compra y Venta de Dólares' },
      { label: 'Giros Internacionales' }
    ]
  },
  {
    category: 'Servicios',
    icon: 'lightbulb',
    subItems: [
      { label: 'Pago de Servicios' },
      { label: 'Recargas' }
    ]
  }
];

export const DIGITAL_CHANNELS_DATA = [
  { label: 'Banca Móvil', icon: 'smartphone' },
  { label: 'Banca por Internet', icon: 'monitor' },
  { label: 'Pago Automático', icon: 'refresh-cw' }
];

export const BENEFITS_DATA = [
  { label: 'Programa de Lealtad Qore', icon: 'award', isNew: true },
  { label: 'Mundo Cuenta Sueldo QORE', icon: 'piggy-bank' },
  { label: 'Mundo Tarjetas de Crédito', icon: 'credit-card' },
  { label: 'Cuotas Sin Intereses', icon: 'shopping-bag' },
  { label: 'Mi Espacio BCP', icon: 'rocket' }
];
