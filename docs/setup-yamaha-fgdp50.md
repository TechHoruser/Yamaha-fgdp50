# Configuración — Yamaha FGDP-50

## Rol del dispositivo

El FGDP-50 actúa como **interfaz de audio USB** y **generador de sonido**. La aplicación captura su salida estéreo mediante la Web Audio API y la procesa como fuente de los loops. El FGDP-50 **no** envía MIDI al looper — su única función es proporcionar la señal de audio.

---

## Requisitos previos

| Plataforma | Driver |
|---|---|
| **Windows** | Instalar el driver ASIO oficial de Yamaha desde [usa.yamaha.com](https://usa.yamaha.com/support/) (buscar "FGDP-50 USB Driver") |
| **macOS** | Clase USB estándar — no requiere driver adicional |

> En Windows, ASIO reduce la latencia a ~5 ms frente a los ~20–30 ms del driver genérico WDM. Se recomienda encarecidamente.

---

## Paso 1 — Conexión física

1. Conectar el FGDP-50 al ordenador mediante el cable **USB-B a USB-A/C** incluido.
2. Encender el FGDP-50 (el interruptor lateral).
3. Esperar a que el sistema operativo lo reconozca como dispositivo de audio.

### Verificación en Windows

```
Panel de control → Sonido → Grabación
→ debe aparecer "Yamaha FGDP-50" o "USB Audio CODEC"
```

### Verificación en macOS

```
Aplicaciones → Utilidades → Configuración de Audio MIDI
→ debe aparecer "FGDP-50" en la lista de dispositivos
```

---

## Paso 2 — Configurar como dispositivo de entrada predeterminado

La Web Audio API de la aplicación usa `navigator.mediaDevices.getUserMedia`. Para que seleccione el FGDP-50 automáticamente hay dos opciones:

### Opción A — Dispositivo de entrada predeterminado del sistema (más sencilla)

Establecer el FGDP-50 como dispositivo de grabación predeterminado en el sistema operativo. La aplicación lo seleccionará automáticamente.

**Windows:** Panel de control → Sonido → Grabación → clic derecho en FGDP-50 → _Establecer como dispositivo predeterminado_

**macOS:** Preferencias del Sistema → Sonido → Entrada → seleccionar _FGDP-50_

### Opción B — ID de dispositivo explícito en el código

Si hay varias interfaces de audio conectadas, es más robusto pasar el `deviceId` directamente al `AudioEngine`. Obtener el ID en la consola del navegador/Wails:

```js
// En la consola de DevTools (Cmd+Opt+I en macOS, F12 en Windows)
const devices = await navigator.mediaDevices.enumerateDevices()
devices.filter(d => d.kind === 'audioinput').forEach(d => console.log(d.label, d.deviceId))
```

Copiar el `deviceId` del FGDP-50 y pasarlo al inicializar el motor de audio:

```ts
// apps/desktop/frontend/src/main.tsx (o donde se instancie AudioEngine)
import { AudioEngine } from '@core/audio-engine'

const engine = new AudioEngine({
  sampleRate: 44100,
  bufferSize: 256,
  inputDeviceId: 'PEGAR_DEVICE_ID_AQUI',
})
await engine.init()
```

---

## Paso 3 — Parámetros de audio recomendados

| Parámetro | Valor recomendado | Motivo |
|---|---|---|
| `sampleRate` | `44100` | Calidad CD estándar |
| `bufferSize` | `256` | ~5.8 ms latencia a 44.1 kHz |
| `echoCancellation` | `false` | Preservar dinámica del instrumento |
| `noiseSuppression` | `false` | Evitar artefactos en las baquetas |
| `autoGainControl` | `false` | Control manual de ganancia en el FGDP-50 |

Estos valores ya están configurados por defecto en `AudioEngine.ts:22-27`.

---

## Paso 4 — Niveles de ganancia en el FGDP-50

1. Usar el dial **MASTER VOLUME** del FGDP-50 para ajustar el nivel de salida hacia la aplicación. Un nivel demasiado alto provocará clipping en el buffer.
2. En la vista de pistas de la aplicación, el indicador de nivel de cada `TrackPanel` debe mantenerse en torno al **70-80 %** durante la grabación.
3. La salida de auriculares/monitor del FGDP-50 es independiente del nivel USB — ajustar por separado si se monitoriza directamente desde el instrumento.

---

## Solución de problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| No aparece audio en la aplicación | FGDP-50 no es el dispositivo predeterminado | Seguir Paso 2 |
| Latencia alta en Windows | Driver WDM activo | Instalar driver ASIO de Yamaha |
| `getUserMedia` lanza `NotAllowedError` | Permisos de micrófono denegados | Preferencias del Sistema → Privacidad → Micrófono → activar para la app |
| `getUserMedia` lanza `NotFoundError` | FGDP-50 no detectado como entrada | Verificar cable USB y conexión |
| Clipping / distorsión | Nivel de salida USB demasiado alto | Bajar MASTER VOLUME en el FGDP-50 |
| Audio cortado / glitches | `bufferSize` demasiado bajo | Aumentar a `512` en `AudioEngine` |
