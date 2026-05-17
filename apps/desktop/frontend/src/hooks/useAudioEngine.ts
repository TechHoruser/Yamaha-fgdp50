import { useEffect, useRef, useState } from 'react'
import { LoopEngine } from '../core/audio-engine'

export function useAudioEngine(deviceId: string, outputDeviceId = '') {
  const engineRef = useRef<LoopEngine | null>(null)
  const [engine, setEngine] = useState<LoopEngine | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setVersion] = useState(0)
  const initializedRef = useRef(false)

  // Initialize engine once on first valid deviceId.
  // sampleRate is intentionally NOT forced — the AudioContext uses the device's
  // native rate, which avoids the internal resampler and lower-quality output
  // that "que devuelva el sonido, actualmente no va muy bien" pointed at.
  useEffect(() => {
    if (!deviceId) return
    let cancelled = false
    const e = new LoopEngine()
    const unsubscribe = e.subscribe(() => setVersion((v) => v + 1))

    e.init({ inputDeviceId: deviceId, outputDeviceId })
      .then(() => {
        if (cancelled) { e.destroy(); return }
        engineRef.current = e
        initializedRef.current = true
        setEngine(e)
        setReady(true)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Error al inicializar audio')
        setReady(false)
      })

    return () => {
      cancelled = true
      unsubscribe()
      initializedRef.current = false
      engineRef.current = null
      setEngine(null)
      setReady(false)
      e.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap input stream when deviceId changes after initialization
  useEffect(() => {
    if (!deviceId || !initializedRef.current || !engineRef.current) return
    engineRef.current
      .updateInputDevice(deviceId)
      .then(() => setError(null))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cambiar dispositivo de audio')
      })
  }, [deviceId])

  // Swap output sink when outputDeviceId changes
  useEffect(() => {
    if (!initializedRef.current || !engineRef.current) return
    engineRef.current
      .setOutputDevice(outputDeviceId)
      .then(() => setError(null))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cambiar salida de audio')
      })
  }, [outputDeviceId])

  return { engine, ready, error }
}
