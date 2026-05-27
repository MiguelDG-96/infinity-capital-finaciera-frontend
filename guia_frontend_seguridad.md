# 🚀 Guía de Integración de Seguridad (Para el Equipo Frontend)

El equipo de Backend de Infinity Capital ha implementado una nueva arquitectura de seguridad de nivel bancario. A continuación, se detallan los flujos que deben integrarse en la interfaz de usuario (React / Angular / Vue) para que la experiencia sea fluida.

---

## 1. El Nuevo Flujo de Inicio de Sesión (2FA)

Ya no devolvemos el Token JWT en el primer paso del login. Ahora la autenticación consta de dos pasos obligatorios.

### 📍 Paso A: Verificación de Credenciales
El usuario ingresa su correo y contraseña en el formulario de login.

**Petición:**
`POST /api/v1/autenticacion/login`
```json
{
  "email": "usuario@gmail.com",
  "contrasena": "MiClaveSecreta123"
}
```

**Respuesta Exitosa (HTTP 200 OK):**
```json
{
  "token": null,
  "refreshToken": null,
  "mensaje": "REQUIRES_2FA",
  "modulos": null
}
```

> [!TIP]
> **Acción en el Frontend:**
> Al detectar `"mensaje" === "REQUIRES_2FA"`, **NO** redirijas al dashboard. Oculta el formulario de contraseña y muestra una nueva pantalla/modal que diga: *"Hemos enviado un código de 6 dígitos a tu correo"*, con un input para el código (OTP).

### 📍 Paso B: Envío del Código 2FA
El usuario revisa su correo, obtiene el código numérico y lo ingresa.

**Petición:**
`POST /api/v1/autenticacion/login/2fa`
```json
{
  "email": "usuario@gmail.com",
  "codigo": "123456"
}
```

**Respuesta Exitosa (HTTP 200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJI...",
  "mensaje": "Login exitoso",
  "modulos": [ ... ]
}
```
> **Acción en el Frontend:** Guarda el token y el refreshToken en el `localStorage` o `cookies` y redirige al Dashboard.

---

## 2. Manejo de Errores de Bloqueo (Fuerza Bruta)

Si el usuario ingresa mal la contraseña varias veces, la API devolverá mensajes específicos en el cuerpo del error (HTTP 500 / 401 / 403 dependiendo de la configuración global de errores). 

Deben atrapar el mensaje de error del backend y mostrarlo en la UI:

- **Primer fallo:** `"Credenciales inválidas. Intentos restantes: 2"`
- **Segundo fallo:** `"Credenciales inválidas. Intentos restantes: 1"`
- **Tercer fallo:** `"Cuenta bloqueada temporalmente por 3 intentos fallidos. Intente en 15 minutos."`
- **Siguientes intentos antes de 15 min:** `"Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente más tarde."`

> [!WARNING]
> **Acción en el Frontend:** Muestren el texto del error en rojo debajo del formulario de login. Si la cuenta se bloquea, pueden deshabilitar el botón de login por 15 minutos (opcional, UX amigable).

---

## 3. Manejo de IP Baneada (Nivel Servidor Web)

Si un atacante realiza intentos masivos (Honeypot), su IP será **baneada del servidor completo** a nivel de `.htaccess`.

- Si el atacante baneado intenta hacer una petición (incluso al index de React si está alojado en el mismo dominio o al cargar recursos de la API), el servidor de cPanel devolverá un error duro **HTTP 403 Forbidden**.
- Si la IP es bloqueada globalmente por la API antes del `.htaccess`, el interceptor de la API devolverá:
  ```json
  {
    "error": "Forbidden",
    "mensaje": "Tu IP ha sido bloqueada por motivos de seguridad.",
    "status": 403
  }
  ```

> [!IMPORTANT]
> **Acción en el Frontend:** En su Interceptor de Axios / Fetch global, si reciben un `HTTP 403` con ese mensaje, redirijan al usuario a una página estática de "Acceso Denegado / IP Bloqueada", explicando que por motivos de seguridad su red ha sido restringida y deben contactar a soporte.

---

## 4. Rate Limiting (Prevención de Spam)

Para evitar que los bots saturen el servidor enviando miles de peticiones al login o registro, existe un límite de peticiones (Rate Limit).

Si superan el límite (ej. más de 5 requests por minuto), la API devolverá:

**HTTP 429 Too Many Requests**
```json
{
  "error": "Demasiadas solicitudes",
  "mensaje": "Has excedido el límite de intentos. Espera 1 minuto e inténtalo de nuevo.",
  "status": 429
}
```

> **Acción en el Frontend:** El Interceptor global debe capturar los códigos `429` y mostrar un 'Toast' o notificación amigable al usuario pidiéndole que espere un momento antes de volver a hacer clic.
