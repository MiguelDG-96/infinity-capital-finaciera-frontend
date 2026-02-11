# Guía de Arquitectura para Financiera (Angular)

Esta guía define la arquitectura para una aplicación financiera de préstamos, utilizando las mejores prácticas modernas de Angular (Standalone Components, Signals).

## 1. Principios de Arquitectura

-   **Basada en Funcionalidades (Feature-Based)**: El código se organiza por dominio de negocio (Préstamos, Clientes, Pagos), no por tipo de archivo.
-   **Separación de Responsabilidades**:
    -   **Pública**: Vistas accesibles para visitantes y clientes (Landing, Solicitud de Préstamo).
    -   **Administrativa (Dashboard)**: Vistas para el personal de la financiera (Aprobaciones, Gestión de Cobros).
-   **State Management Ligero**: Uso de **Signals** en Servicios para manejar el estado global y local sin necesidad de librerías complejas (como NgRx) al inicio.

## 2. Estructura de Directorios

```
src/app/
├── core/                   # Singleton services, interceptors, guards
│   ├── auth/               # AuthService, Guards (AdminGuard, ClientGuard)
│   ├── interceptors/       # TokenInterceptor, ErrorInterceptor
│   ├── mappers/            # Mappers para transformar DTOs <-> Modelos
│   ├── models/             # Interfaces globales (User, Loan, Payment)
│   └── services/           # ApiService, ConfigService
├── environments/           # Variables de entorno (API URL, Keys)
├── shared/                 # Componentes reutilizables (UI Kit)
│   ├── components/         # Button, Input, Table, Modal, Card
│   ├── pipes/              # CurrencyFormat, DateFormat
│   └── directives/         # PermissionsDirective
├── layouts/                # Estructuras base de las páginas
│   ├── public-layout/      # Header, Footer, router-outlet (Landing)
│   └── admin-layout/       # Sidebar, Navbar, router-outlet (Dashboard)
└── features/               # Módulos de negocio (Lazy Loaded)
    ├── auth/               # Login, Registro, Recuperar Contraseña
    ├── public/             # Landing Page, Simulador de Crédito
    │   ├── landing/
    │   └── simulator/
    ├── dashboard/          # Vista principal del admin (KPIs, Resumen)
    ├── loans/              # Gestión de Préstamos
    │   ├── loan-list/      # Tabla de préstamos
    │   ├── loan-detail/    # Detalle, Cronograma de pagos
    │   └── loan-create/    # Formulario de solicitud/creación
    ├── clients/            # Gestión de Clientes (CRM)
    │   ├── client-list/
    │   └── client-profile/ # Historial crediticio, datos
    └── payments/           # Registro y control de pagos
```

## 3. Detalle de Módulos (Features)

### A. Módulo Público (`features/public`)
Orientado a la conversión y autoservicio.
-   **Simulador de Crédito**: Herramienta clave para atraer clientes. Calcula cuotas basado en tasa y plazo.
-   **Solicitud Online**: Formulario paso a paso (Wizard) para solicitar un préstamo.

### C. Mappers y Entornos
-   **Mappers (`core/mappers`)**: Funciones puras o clases para desacoplar la API del Frontend.
    -   *Ejemplo*: Transformar `created_at` (string) del backend a `Date` object en el frontend.
-   **Environments (`environments/`)**:
    -   `environment.ts`: Desarrollo (localhost).
    -   `environment.prod.ts`: Producción (URL real).

### B. Módulo Administrativo (`features/admin` o distribuido)
Orientado a la productividad y análisis.
-   **Dashboard**: Gráficos de colocación diaria, mora, liquidez.
-   **Loans (Préstamos)**: Flujo de aprobación (Pendiente -> Evaluación -> Aprobado -> Desembolsado).
-   **Cobranzas**: Listados de cuotas vencidas, gestión de llamadas/compromisos de pago.

## 4. Estrategia de Ruteo (App.Routes.ts)

Separación clara mediante `layouts`.

```typescript
export const routes: Routes = [
  // Rutas Públicas
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/public/landing/landing.component') },
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component') }
    ]
  },
  // Rutas Administrativas (Protegidas)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard], // Solo empleados
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component') },
      { path: 'loans', loadChildren: () => import('./features/loans/loans.routes') },
      { path: 'clients', loadChildren: () => import('./features/clients/clients.routes') }
    ]
  }
];
```

## 5. Tecnologías y Librerías Recomendadas
-   **UI Kit**: Angular Material o PrimeNG (para tablas de datos complejas en Admin), TailwindCSS (para diseño a medida en Público).
-   **Gráficos**: Ngx-Charts o Chart.js para el Dashboard.
-   **Formularios**: Reactive Forms con validaciones estrictas (montos, plazos).

## 6. Flujo de Trabajo (Workflow)
1.  **Configurar Layouts**: Crear `MainLayout` y `AuthLayout`.
2.  **Core Services**: Configurar `ApiService` para comunicar con el Backend.
3.  **Feature Auth**: Implementar Login y Guardado de Token.
4.  **Feature Dashboard**: Estructura base del panel administrativo.
5.  **Features de Negocio**: Implementar Préstamos y Clientes progresivamente.

## 7. Ejemplo Detallado: Módulo de Préstamos (`features/loans`)

Estructura interna recomendada para un módulo de funcionalidad compleja:

```
src/app/features/loans/
├── components/           # Componentes "tontos" (Presentational) específicos de préstamos
│   ├── loan-card/
│   └── amortization-table/
├── pages/                # Componentes "inteligentes" (Container/Page)
│   ├── loan-list/        # Página de listado
│   ├── loan-detail/      # Página de detalle
│   └── loan-application/ # Página de solicitud
├── services/             # Lógica de negocio y llamadas API
│   └── loans.service.ts
├── models/               # Modelos específicos del dominio
│   ├── loan.model.ts
│   └── amortization.model.ts
└── loans.routes.ts       # Definición de rutas del módulo
```

### Ejemplo de `loans.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const LOAN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/loan-list/loan-list.component').then(m => m.LoanListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/loan-application/loan-application.component').then(m => m.LoanApplicationComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/loan-detail/loan-detail.component').then(m => m.LoanDetailComponent)
  }
];
```
