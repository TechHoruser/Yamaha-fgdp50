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

1. Abrir la **Stream Deck Store** (icono de tienda en la app).
2. Buscar **"API Ninja"** e instalar.
3. Arrastrar la acción _API Ninja → HTTP Request_ a cada botón.
4. Configurar cada botón:
   - **URL:** `http://localhost:9001/command`
   - **Method:** `POST`
   - **Headers:** `Content-Type: application/json`
   - **Body:** el JSON correspondiente (ver tabla de arriba)

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
