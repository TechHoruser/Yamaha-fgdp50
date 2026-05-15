# Configuración — Elgato Stream Deck

## Arquitectura de comunicación

Cuando FGDP Looper arranca, el backend en Go levanta un servidor HTTP local en el puerto **9001**. El Stream Deck envía comandos a ese servidor mediante peticiones **POST** a `http://localhost:9001/command` con un cuerpo JSON.

```
┌─────────────────┐   HTTP POST :9001   ┌──────────────────────┐
│  Stream Deck SW │ ──────────────────► │  FGDP Looper (Go)    │
│  (perfil+plugin)│                     │  /command endpoint   │
└─────────────────┘                     └──────────────────────┘
```

El Stream Deck **no** necesita MIDI, WebSocket ni ningún protocolo adicional.

---

## Referencia de la API

**Endpoint:** `POST http://localhost:9001/command`  
**Content-Type:** `application/json`  
**Respuesta exitosa:** `204 No Content`

### Estructura del cuerpo

```json
{
  "action": "NOMBRE_DE_LA_ACCION",
  "payload": {}
}
```

`payload` es opcional en todos los comandos actuales.

### Tabla completa de acciones (layout 3×5)

| Fila | Posición | `action` | Descripción |
|------|----------|----------|-------------|
| **1** | 1 | `SELECT_TRACK_1` | Selecciona el Track 1 como activo |
| **1** | 2 | `SELECT_TRACK_2` | Selecciona el Track 2 como activo |
| **1** | 3 | `SELECT_TRACK_3` | Selecciona el Track 3 como activo |
| **1** | 4 | `SELECT_TRACK_4` | Selecciona el Track 4 como activo |
| **1** | 5 | `UNDO` | Deshace la última grabación del track activo |
| **2** | 1 | `PREV_TRACK` | Cambia al track anterior (circular) |
| **2** | 2 | `NEXT_TRACK` | Cambia al track siguiente (circular) |
| **2** | 3 | `MUTE_ACTIVE` | Alterna mute en el track activo |
| **2** | 4 | `CLEAR_ACTIVE` | Borra el loop del track activo |
| **2** | 5 | `TOGGLE_METRONOME` | Activa / desactiva el metrónomo |
| **3** | 1 | `PLAY_PAUSE` | Play global / pausa global |
| **3** | 2 | `RECORD` | Inicia nueva grabación en el track activo |
| **3** | 3 | `OVERDUB` | Sobrescribe sobre el loop existente del track activo |
| **3** | 4 | `STOP` | Detiene todo y resetea el transporte |
| **3** | 5 | `SHIFT` | Tecla modificadora (reservada para sub-funciones) |

### Ejemplo con curl

```bash
# Iniciar grabación en el track activo
curl -s -X POST http://localhost:9001/command \
  -H "Content-Type: application/json" \
  -d '{"action":"RECORD"}'

# Seleccionar track 2
curl -s -X POST http://localhost:9001/command \
  -H "Content-Type: application/json" \
  -d '{"action":"SELECT_TRACK_2"}'
```

---

## Método recomendado — Plugin "API Ninja" (Stream Deck Marketplace)

Es el método más rápido y no requiere escribir scripts.

### Instalación

1. Abrir la **Stream Deck Software** en el ordenador.
2. Pulsar el icono de la tienda (bolsa de compra) en la esquina superior derecha.
3. Buscar **"API Ninja"** → pulsar **Install**.
4. Una vez instalado, en el panel de acciones de la izquierda aparece la categoría **API Ninja**.

### Configuración de un botón

1. Arrastrar la acción **API Ninja → HTTP Request** al botón deseado en el perfil.
2. En el panel de propiedades de la derecha, rellenar exactamente estos campos:

| Campo | Valor |
|---|---|
| **URL** | `http://localhost:9001/command` |
| **Method** | `POST` |
| **Content Type** | `application/json` |
| **Body** | `{"action":"RECORD"}` ← cambiar por la acción del botón |

> El campo **Body** debe ser JSON puro, sin saltos de línea ni comillas extra alrededor. Ejemplo para el botón PLAY/PAUSE: `{"action":"PLAY_PAUSE"}`.

3. El campo **Title** del botón (encima del icono) es opcional; se puede poner el nombre de la acción para identificarlo visualmente.

### Cómo saber que API Ninja está funcionando correctamente

**Paso 1 — Verificar el endpoint antes de tocar el Stream Deck**

Con FGDP Looper abierto, abrir **PowerShell** y ejecutar:

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:9001/command" `
  -ContentType "application/json" -Body '{"action":"PLAY_PAUSE"}'
```

- **Éxito:** no aparece ningún output (la respuesta es `204 No Content`, que PowerShell no imprime).
- **Fallo:** aparece un error `connection refused` → la app no está abierta o el firewall bloquea el puerto (ver sección "Verificar que la comunicación funciona").

Si este paso falla, el problema no está en API Ninja sino en la app o el firewall. Resolverlo antes de continuar.

**Paso 2 — Comprobar la respuesta en API Ninja**

API Ninja muestra el resultado del último envío directamente en el icono del botón:

- **Icono verde / sin cambio visible:** el servidor respondió `2xx` → comando recibido correctamente.
- **Icono rojo o texto de error sobre el botón:** el servidor devolvió un error o no respondió. Los errores más comunes son:

| Indicador en el botón | Causa | Solución |
|---|---|---|
| `ERR_CONNECTION_REFUSED` | FGDP Looper no está abierto | Abrir la aplicación primero |
| `400 Bad Request` | El JSON del campo Body está mal formado | Revisar comillas dobles y que el campo `action` existe |
| `405 Method Not Allowed` | El campo Method está en `GET` en vez de `POST` | Cambiarlo a `POST` |
| `404 Not Found` | La URL termina en `/command/` con barra o tiene una ruta diferente | Usar exactamente `http://localhost:9001/command` |

**Paso 3 — Confirmar el efecto en FGDP Looper**

La forma más rápida de confirmar que el botón funciona de extremo a extremo:

1. Asegurarse de que FGDP Looper está en primer plano y visible.
2. Pulsar el botón del Stream Deck.
3. Observar la interfaz de FGDP Looper:
   - `SELECT_TRACK_2` → el borde verde pasa al panel **TRACK 2**.
   - `PLAY_PAUSE` → el botón **PLAY/PAUSE** de la barra de transporte se ilumina en verde.
   - `RECORD` → el botón **RECORD** se ilumina en rojo.
   - `TOGGLE_METRONOME` → el botón **METRO** cambia de color.
   - `MUTE_ACTIVE` → el panel de la pista activa reduce su opacidad y muestra `MUTED`.

Si la UI de FGDP Looper cambia, la configuración es correcta.

**Paso 4 — Verificar con el log de API Ninja (opcional)**

Algunos builds de API Ninja muestran un log detallado:

1. Hacer clic derecho sobre el botón en el Stream Deck Software.
2. Si aparece la opción **"Show Log"** o **"Debug"**, abrirla.
3. Pulsar el botón; en el log debe aparecer una línea similar a:
   ```
   POST http://localhost:9001/command → 204
   ```
   El código `204` confirma que el servidor recibió y procesó el comando.

### Lista de comprobación rápida

Antes de dar por configurado un botón, verificar cada punto:

- [ ] FGDP Looper está abierto
- [ ] El test con PowerShell/curl devuelve `204` (ver Paso 1)
- [ ] El campo **Method** en API Ninja es `POST`, no `GET`
- [ ] El campo **Content Type** es `application/json`
- [ ] El campo **Body** contiene JSON válido con comillas dobles: `{"action":"NOMBRE_ACCION"}`
- [ ] La URL es exactamente `http://localhost:9001/command` (sin barra final)
- [ ] Al pulsar el botón, la UI de FGDP Looper reacciona visualmente

---

## Método alternativo — Scripts con curl (sin plugins de terceros)

Si se prefiere no instalar plugins externos, cada botón del Stream Deck puede ejecutar un script del sistema.

### macOS — Script de shell

Crear un archivo `.sh` por cada acción. Ejemplo para `RECORD`:

```bash
# ~/fgdp-scripts/record.sh
#!/bin/bash
curl -s -X POST http://localhost:9001/command \
  -H "Content-Type: application/json" \
  -d '{"action":"RECORD"}'
```

```bash
chmod +x ~/fgdp-scripts/record.sh
```

En Stream Deck: acción **System → Open** → seleccionar el `.sh`.  
En macOS 13+, la Terminal puede cerrarse inmediatamente; si el script no se ejecuta, envolverlo en un `.command`:

```bash
# ~/fgdp-scripts/record.command  (doble clic para probar)
#!/bin/bash
curl -s -X POST http://localhost:9001/command \
  -H "Content-Type: application/json" \
  -d '{"action":"RECORD"}'
```

### Windows — Script PowerShell

```powershell
# C:\fgdp-scripts\record.ps1
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:9001/command" `
  -ContentType "application/json" `
  -Body '{"action":"RECORD"}'
```

En Stream Deck: acción **System → Open** → seleccionar el `.ps1`.  
Si PowerShell bloquea la ejecución de scripts:

```powershell
# Ejecutar una vez en PowerShell como Administrador
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Configuración del perfil en Stream Deck Software

### Crear el perfil FGDP Looper

1. Abrir **Elgato Stream Deck** (versión 6.x o superior).
2. Clic en el selector de perfiles (arriba) → **New Profile** → nombrar `FGDP Looper`.
3. Elegir el modelo de dispositivo (Stream Deck MK.2 / XL / Mini según el hardware).

### Asignación visual recomendada (Stream Deck MK.2 — 15 botones)

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│   TRACK 1    │   TRACK 2    │   TRACK 3    │   TRACK 4    │     UNDO     │
│  [verde]     │  [verde]     │  [verde]     │  [verde]     │  [naranja]   │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│   ◄ PREV     │   NEXT ►     │   MUTE       │   CLEAR      │  METRONOMO   │
│  [gris]      │  [gris]      │  [amarillo]  │  [rojo]      │  [azul]      │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│  PLAY/PAUSE  │   RECORD     │   OVERDUB    │    STOP      │   SHIFT      │
│  [verde]     │  [rojo]      │  [morado]    │  [rojo osc]  │  [gris osc]  │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### Sugerencias de iconos

Usar el editor de iconos integrado en Stream Deck o importar SVGs propios:
- Track activo: fondo verde `#4CAF50`
- Record: fondo rojo `#F44336` con símbolo ●
- Overdub: fondo morado `#9C27B0` con símbolo ●●
- Stop: fondo rojo oscuro `#B71C1C` con símbolo ■
- Mute: fondo amarillo `#FFC107` con símbolo 🔇
- Clear: fondo rojo `#E53935` con símbolo ✕

---

## Verificar que la comunicación funciona

Con FGDP Looper abierto, probar desde la terminal antes de configurar el Stream Deck:

```bash
# macOS / Linux
curl -v -X POST http://localhost:9001/command \
  -H "Content-Type: application/json" \
  -d '{"action":"PLAY_PAUSE"}'
# Respuesta esperada: HTTP/1.1 204 No Content
```

```powershell
# Windows PowerShell
Invoke-RestMethod -Method POST -Uri "http://localhost:9001/command" `
  -ContentType "application/json" -Body '{"action":"PLAY_PAUSE"}'
# Sin output = éxito (204)
```

Si la respuesta es `connection refused`, la aplicación no está en ejecución o el puerto 9001 está bloqueado por el firewall.

### Desbloquear el puerto 9001 en Windows Firewall

```powershell
# Ejecutar como Administrador
New-NetFirewallRule -DisplayName "FGDP Looper" `
  -Direction Inbound -Protocol TCP -LocalPort 9001 -Action Allow
```

En macOS, el sistema pedirá permiso la primera vez que la app escuche en un puerto — aceptar.

---

## Solución de problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `connection refused` al enviar comandos | La app no está corriendo | Arrancar FGDP Looper primero |
| `connection refused` con la app abierta | Puerto 9001 bloqueado | Crear regla en el firewall (ver arriba) |
| El botón del Stream Deck no hace nada | Script sin permisos de ejecución | `chmod +x` en macOS / `Set-ExecutionPolicy` en Windows |
| Comandos llegan con retraso | Latencia de red del sistema | Verificar que `localhost` resuelve a `127.0.0.1` (no IPv6) |
| `405 Method Not Allowed` | El plugin envía GET en vez de POST | Cambiar Method a POST en la configuración del plugin |
| `400 Bad Request` | JSON malformado | Verificar comillas dobles y campo `action` exacto |
