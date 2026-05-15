# Guía de usuario — Windows

## Requisitos del sistema

| Componente | Mínimo |
|---|---|
| Sistema operativo | Windows 10 64-bit (build 1903 o superior) / Windows 11 |
| Procesador | Intel/AMD x64 con soporte SSE2 |
| RAM | 4 GB |
| Espacio en disco | 150 MB |
| Hardware requerido | Yamaha FGDP-50 conectado por USB |
| Hardware opcional | Elgato Stream Deck (cualquier modelo) |

---

## 1. Instalación

### 1.1 Descargar el instalador

1. Ir a la página de **Releases** del repositorio en GitHub.
2. En la release más reciente, descargar `fgdp-looper-amd64-installer.exe`.

### 1.2 Ejecutar el instalador

1. Hacer doble clic en `fgdp-looper-amd64-installer.exe`.
2. Si aparece el diálogo **Control de cuentas de usuario (UAC)**, pulsar **Sí**.
3. Seguir el asistente (Next → Install → Finish).
4. El instalador crea:
   - Un acceso directo en el **menú Inicio** → _FGDP Looper_
   - Un acceso directo en el **escritorio** (opcional, desmarcar si no se desea)
   - El desinstalador en **Configuración → Aplicaciones**

### 1.3 Desinstalar

Ir a **Configuración → Aplicaciones → FGDP Looper → Desinstalar**.

---

## 2. Configuración de hardware

Antes de abrir la aplicación por primera vez, completar la configuración del hardware:

- **Yamaha FGDP-50**: seguir la guía [`docs/setup-yamaha-fgdp50.md`](./setup-yamaha-fgdp50.md).  
  Resumen clave: instalar el driver ASIO de Yamaha y establecer el FGDP-50 como dispositivo de grabación predeterminado en el Panel de control de sonido.
- **Elgato Stream Deck** (opcional): seguir la guía [`docs/setup-stream-deck.md`](./setup-stream-deck.md).

---

## 3. Primera ejecución

### 3.1 Abrir la aplicación

Abrir **FGDP Looper** desde el menú Inicio o el acceso directo del escritorio.

### 3.2 Conceder permisos de micrófono

La primera vez que la aplicación accede al audio, Windows muestra una solicitud de permisos:

1. Cuando aparezca la ventana _"¿Permitir que FGDP Looper acceda al micrófono?"_, pulsar **Permitir**.
2. Si el diálogo no aparece o se denegó accidentalmente:
   - Ir a **Inicio → Configuración → Privacidad y seguridad → Micrófono**.
   - Activar **Permitir que las aplicaciones de escritorio accedan al micrófono**.
   - Reiniciar FGDP Looper.

### 3.3 Verificar la entrada de audio

Con el FGDP-50 conectado y encendido:

1. En Windows, ir a **Panel de control → Sonido → Grabación** y comprobar que _Yamaha FGDP-50_ (o _USB Audio CODEC_) está marcado como dispositivo predeterminado.
2. Tocar las baquetas en el FGDP-50; el indicador de nivel de ese dispositivo debería moverse.

### 3.4 Desbloquear el puerto 9001 (necesario para Stream Deck)

Si se usa el Stream Deck, Windows Firewall bloquea por defecto el puerto 9001. Crear la regla una sola vez:

```powershell
# Ejecutar PowerShell como Administrador
New-NetFirewallRule -DisplayName "FGDP Looper" `
  -Direction Inbound -Protocol TCP -LocalPort 9001 -Action Allow
```

O bien: **Panel de control → Firewall de Windows → Permitir una aplicación** → añadir `fgdp-looper.exe`.

---

## 4. Descripción de la interfaz

```
┌─────────────────────────────────────────────────────────┐
│  FGDP LOOPER                                            │
├──────────────┬──────────────┬──────────────┬────────────┤
│   TRACK 1    │   TRACK 2    │   TRACK 3    │  TRACK 4   │
│   (activo)   │              │              │            │
│   PLAYING    │   EMPTY      │   EMPTY      │   EMPTY    │
├──────────────┴──────────────┴──────────────┴────────────┤
│ [PLAY/PAUSE] [RECORD] [OVERDUB] [STOP] [UNDO]  METRO [▶] 120 BPM │
└─────────────────────────────────────────────────────────┘
```

### 4.1 Paneles de pista (TRACK 1 – 4)

Hay cuatro pistas independientes. Cada panel muestra:

| Indicador | Significado |
|---|---|
| Borde **verde** | Pista actualmente seleccionada (activa) |
| Borde **gris** | Pista no seleccionada |
| Texto `EMPTY` | Sin loop grabado |
| Texto `PLAYING` | Loop grabado, reproduciéndose |
| Texto `MUTED` | Loop grabado pero silenciado |
| Opacidad reducida | Pista muteada |

Pulsar un panel lo selecciona como pista activa. Las operaciones de grabación, overdub, mute, clear y undo actúan siempre sobre la pista activa.

### 4.2 Barra de transporte

| Botón | Color activo | Acción |
|---|---|---|
| **PLAY/PAUSE** | Verde | Inicia o pausa la reproducción global de todos los loops |
| **RECORD** | Rojo | Inicia la grabación en la pista activa |
| **OVERDUB** | Verde | Añade una capa sobre el loop existente de la pista activa |
| **STOP** | — | Detiene todo y resetea el transporte al inicio |
| **UNDO** | — | Elimina el loop de la pista activa (deshace la última grabación) |

### 4.3 Metrónomo

El widget de metrónomo está a la derecha de la barra de transporte:

- Botón **METRO**: activa (verde) o desactiva el metrónomo de click.
- Campo **BPM**: introducir un valor entre 40 y 240 para cambiar el tempo. El cambio es inmediato.

---

## 5. Flujo de trabajo básico

### 5.1 Grabar el primer loop

1. Asegurarse de que el FGDP-50 está conectado y es el dispositivo de grabación predeterminado.
2. (Opcional) Activar el metrónomo con **METRO** y ajustar el BPM.
3. Pulsar **RECORD** — el botón se ilumina en rojo.
4. Tocar la batería.
5. Pulsar **STOP** para finalizar la grabación. La pista pasa a estado `PLAYING`.
6. Pulsar **PLAY/PAUSE** para escuchar el loop en bucle.

### 5.2 Grabar en una segunda pista

1. Mientras el loop de la pista 1 se reproduce, pulsar **TRACK 2** para seleccionarla.
2. Pulsar **RECORD** y grabar el segundo loop sincronizado con el primero.
3. Pulsar **STOP**.

### 5.3 Añadir una capa (Overdub)

1. Seleccionar una pista que ya tenga loop (`PLAYING`).
2. Pulsar **OVERDUB** — el botón se ilumina.
3. Tocar. El nuevo audio se superpone al loop existente sin borrar lo anterior.
4. Pulsar **STOP** para consolidar.

### 5.4 Mutear y desmutear una pista

- Pulsar el panel de la pista para seleccionarla.
- Desde el **Stream Deck**, usar el botón `MUTE_ACTIVE`.
- La pista aparece con opacidad reducida y muestra `MUTED`.

### 5.5 Borrar un loop

- Seleccionar la pista.
- Desde el **Stream Deck**, usar el botón `CLEAR_ACTIVE`.
- La pista vuelve a `EMPTY`.

### 5.6 Deshacer la grabación

- Pulsar **UNDO** en la barra de transporte (o `UNDO` en el Stream Deck).
- El loop de la pista activa se elimina y vuelve a `EMPTY`.

---

## 6. Referencia rápida de controles

### Interfaz gráfica (ratón / pantalla táctil)

| Acción | Control |
|---|---|
| Seleccionar pista | Clic en el panel de la pista |
| Play / Pause global | Botón **PLAY/PAUSE** |
| Grabar | Botón **RECORD** |
| Overdub | Botón **OVERDUB** |
| Parar todo | Botón **STOP** |
| Deshacer loop activo | Botón **UNDO** |
| Activar/desactivar metrónomo | Botón **METRO** |
| Cambiar BPM | Campo numérico BPM |

### Stream Deck (HTTP, puerto 9001)

Ver la tabla completa en [`docs/setup-stream-deck.md`](./setup-stream-deck.md).

| Fila / Pos | Acción | Efecto |
|---|---|---|
| 1-1 a 1-4 | `SELECT_TRACK_1` … `SELECT_TRACK_4` | Selecciona la pista correspondiente |
| 1-5 | `UNDO` | Elimina el loop de la pista activa |
| 2-1 | `PREV_TRACK` | Pista anterior (circular) |
| 2-2 | `NEXT_TRACK` | Pista siguiente (circular) |
| 2-3 | `MUTE_ACTIVE` | Alterna mute en la pista activa |
| 2-4 | `CLEAR_ACTIVE` | Borra el loop de la pista activa |
| 2-5 | `TOGGLE_METRONOME` | Activa/desactiva metrónomo |
| 3-1 | `PLAY_PAUSE` | Play/pausa global |
| 3-2 | `RECORD` | Graba en la pista activa |
| 3-3 | `OVERDUB` | Overdub sobre la pista activa |
| 3-4 | `STOP` | Detiene todo |
| 3-5 | `SHIFT` | Modificadora (reservada) |

---

## 7. Solución de problemas en Windows

### La aplicación no abre / se cierra inmediatamente

- Comprobar que el sistema es Windows 10 64-bit o superior.
- Si aparece el error _"VCRUNTIME140.dll no encontrado"_, instalar el paquete **Microsoft Visual C++ Redistributable** desde [aka.ms/vs/17/release/vc_redist.x64.exe](https://aka.ms/vs/17/release/vc_redist.x64.exe).
- Revisar el **Visor de eventos** (buscar "Visor de eventos" en el menú Inicio) → Registros de Windows → Aplicación para ver el error exacto.

### No se captura audio del FGDP-50

| Síntoma | Solución |
|---|---|
| La barra de transporte no reacciona al tocar | Verificar que FGDP-50 es el dispositivo de grabación predeterminado |
| `getUserMedia` error en consola (F12) | Activar permisos de micrófono en Configuración → Privacidad |
| Audio capturado con alta latencia | Instalar el driver ASIO de Yamaha (ver `setup-yamaha-fgdp50.md`) |
| Audio cortado / glitches | Aumentar el `bufferSize` en `AudioEngine.ts` de 256 a 512 |

### El Stream Deck no envía comandos

| Síntoma | Solución |
|---|---|
| `connection refused` | La app no está abierta, o el puerto 9001 está bloqueado por el firewall (ver sección 3.4) |
| Botón no responde (sin error) | Comprobar que el script `.ps1` tiene permisos: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `400 Bad Request` | Verificar que el JSON del botón usa comillas dobles y el campo `action` en mayúsculas |
| `405 Method Not Allowed` | El plugin del Stream Deck está enviando GET en lugar de POST; cambiar el método en la config del botón |

### Windows Defender bloquea el ejecutable

El instalador no está firmado con certificado de código EV, lo que puede provocar que SmartScreen muestre una advertencia:

1. En el diálogo _"Windows protegió su PC"_, pulsar **Más información**.
2. Pulsar **Ejecutar de todas formas**.

Esto solo ocurre la primera vez. El aviso desaparece si el ejecutable acumula suficientes ejecuciones en el sistema de reputación de Microsoft.

### El firewall pregunta al abrir la aplicación

Cuando FGDP Looper arranca, Go levanta un servidor HTTP en el puerto 9001 (para el Stream Deck). Windows Firewall puede mostrar un diálogo de confirmación:

- Marcar **Redes privadas** y pulsar **Permitir acceso**.
- Si se cancela, el Stream Deck no podrá comunicarse con la app hasta crear la regla manualmente (ver sección 3.4).

---

## 8. Actualizaciones

FGDP Looper no tiene actualizaciones automáticas. Para actualizar:

1. Descargar el nuevo `fgdp-looper-amd64-installer.exe` desde la página de Releases.
2. Ejecutarlo directamente — el instalador reemplaza la versión anterior sin necesidad de desinstalar primero.
3. La configuración del Stream Deck no se ve afectada por la actualización.
