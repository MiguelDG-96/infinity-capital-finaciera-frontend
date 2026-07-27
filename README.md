# CapitalFinanceFrontend

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

---

## 🗄️ Administración de Base de Datos

### Eliminar un Crédito completo (con todos sus datos relacionados)

> ⚠️ **IRREVERSIBLE** — Ejecutar solo cuando sea estrictamente necesario. El orden importa por las llaves foráneas.

**Flujo obligatorio (hijo → padre):**

```
movimientos  →  depende de cuotas y creditos
requisitos   →  depende de creditos
cuotas       →  depende de creditos
creditos     →  tabla principal (eliminar al final)
```

**SQL — Reemplazar `<ID>` con el id del crédito a eliminar:**

```sql
START TRANSACTION;

-- 1. Desvincular créditos refinanciados que apunten a este (si existen)
UPDATE creditos SET credito_origen_id = NULL WHERE credito_origen_id = <ID>;

-- 2. Eliminar movimientos (pagos, desembolsos, ajustes)
DELETE FROM movimientos WHERE credito_id = <ID>;

-- 3. Eliminar requisitos/documentos del crédito
DELETE FROM requisitos WHERE credito_id = <ID>;

-- 4. Eliminar cuotas del cronograma
DELETE FROM cuotas WHERE credito_id = <ID>;

-- 5. Eliminar el crédito (siempre al último)
DELETE FROM creditos WHERE id = <ID>;

-- ✅ Confirmar si todo salió bien
COMMIT;

-- ❌ Revertir si algo falló
-- ROLLBACK;
```

---

### Anular un Pago de Cuota manualmente

Cuando se elimina un movimiento de pago directamente en BD, hay que revertir también la cuota y el saldo del crédito:

```sql
-- 1. Revertir el estado de la cuota
UPDATE cuotas SET
    estado_cuota         = 'PENDIENTE',
    monto_pagado_cliente = 0,
    fecha_pago           = NULL,
    metodo_pago          = NULL,
    numero_comprobante   = NULL
WHERE id = <ID_CUOTA>;

-- 2. Restaurar el saldo del crédito (sumar capital de esa cuota)
UPDATE creditos
SET debe_actualidad = debe_actualidad + (SELECT capital FROM cuotas WHERE id = <ID_CUOTA>)
WHERE id = <ID_CREDITO>;

-- 3. Eliminar el/los movimiento(s) del pago
DELETE FROM movimientos WHERE cuota_id = <ID_CUOTA>;
```
