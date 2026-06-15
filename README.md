# CapitalFinanceFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

## Estándares de Diseño UI

### 1. Modales Estándar (Componentes Formularios y Vistas)
Para modales que contienen formularios, detalles complejos o acciones principales (como Editar Crédito, Pago Anticipado, Abono Global o Resolver Contrato), se utiliza la estructura nativa de DaisyUI (`modal-box`).

```html
<div class="modal modal-open">
  <div class="modal-box bg-base-100 max-w-md border border-base-content/10 shadow-2xl rounded-3xl">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="font-black text-xl flex items-center gap-2">
        <lucide-icon name="icon-name" class="text-primary w-6 h-6"></lucide-icon>
        Título del Modal
      </h3>
      <button class="btn btn-ghost btn-sm btn-circle" (click)="cerrar()">
        <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
      </button>
    </div>
    
    <!-- Contenido Principal -->
    <div class="space-y-4">
       <!-- Formularios, textos, alertas, etc... -->
    </div>

    <!-- Botones de Acción (inferior) -->
    <div class="modal-action pt-4 flex gap-2">
      <button type="button" class="btn btn-ghost rounded-2xl flex-1">Cancelar</button>
      <button type="button" class="btn btn-primary px-8 rounded-2xl shadow-lg shadow-primary/20 flex-1">
        Confirmar Acción
      </button>
    </div>
  </div>
</div>
```

### 2. Alertas de Confirmación Crítica (Efecto Glassmorphism)
Para acciones destructivas o críticas puntuales que requieren una confirmación simple del tipo "Sí/No" (por ejemplo: Cerrar Sesión, Regenerar Cronograma, Generar Cuota Vencida). Se utiliza un diseño de cristal esmerilado que desenfoca la pantalla y resalta la alerta con una luz de acento decorativa en la esquina.

```html
<!-- Wrapper fijo con fondo oscuro y blur (backdrop-blur-sm) -->
<div class="fixed inset-0 z-[10000] pointer-events-auto flex items-center justify-center bg-black/40 backdrop-blur-sm">
  
  <!-- Contenedor central Glassmorphism -->
  <div class="relative w-full max-w-sm m-4 p-8 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-base-100/60 backdrop-blur-xl border border-white/20 dark:border-white/5 animate-fade-in text-center overflow-hidden">
    
    <!-- Fondo Decorativo Sutil (Luz de acento) ej: warning, error, primary -->
    <div class="absolute -top-10 -right-10 w-32 h-32 bg-warning/20 rounded-full blur-3xl pointer-events-none"></div>
    
    <!-- Título con Icono -->
    <h3 class="font-bold text-xl text-base-content mb-4 flex items-center justify-center gap-2">
      <lucide-icon name="alert-triangle" class="w-6 h-6 text-warning"></lucide-icon>
      Título de la Alerta
    </h3>
    
    <!-- Descripción -->
    <p class="py-2 text-base-content/80 relative z-10 text-sm leading-relaxed">
      ¿Estás seguro de realizar esta acción irreversible? Explica brevemente la consecuencia aquí.
    </p>
    
    <!-- Botones de Acción -->
    <div class="mt-6 flex justify-center gap-4 relative z-10">
      <button class="btn btn-ghost hover:bg-base-content/10 border-transparent">
        Cancelar
      </button>
      <button class="btn btn-warning text-warning-content shadow-lg shadow-warning/30">
        Sí, ejecutar
      </button>
    </div>
  </div>
</div>
```
