import { useEffect, useRef, useState } from 'react'
import { LoopEngine } from '../core/audio-engine'

export function useAudioEngine(deviceId: string, outputDeviceId = '') {
  const engineRef = useRef<LoopEngine | null>(null)
  const [engine, setEngine] = useState<LoopEngine | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setVersion] = useState(0)
  const initializedRef = useRef(false)
  // Keep a ref so the init effect always reads the latest outputDeviceId
  // without needing to be in the dependency array (which would re-init the engine).
  const outputDeviceIdRef = useRef(outputDeviceId)
  useEffect(() => { outputDeviceIdRef.current = outputDeviceId }, [outputDeviceId])

  // Initialize engine once — on the first render where deviceId is non-empty.
  // Re-runs if deviceId changes while not yet initialized (e.g. permission granted
  // after the first render).
  useEffect(() => {
    if (!deviceId || initializedRef.current) return
    let cancelled = false
    const e = new LoopEngine()
    const unsubscribe = e.subscribe(() => setVersion((v) => v + 1))

    e.init({ inputDeviceId: deviceId, outputDeviceId: outputDeviceIdRef.current })
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
      // Only destroy if this effect's engine didn't finish initializing.
      // The initialized engine lives until the component unmounts (see below).
      if (!initializedRef.current) e.destroy()
    }
  }, [deviceId])

  // Swap input stream when deviceId changes after initialization.
  useEffect(() => {
    if (!deviceId || !initializedRef.current || !engineRef.current) return
    engineRef.current
      .updateInputDevice(deviceId)
      .then(() => setError(null))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cambiar dispositivo de entrada')
      })
  }, [deviceId])

  // Swap output sink when outputDeviceId changes.
  useEffect(() => {
    if (!initializedRef.current || !engineRef.current) return
    engineRef.current
      .setOutputDevice(outputDeviceId)
      .then(() => setError(null))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cambiar salida de audio')
      })
  }, [outputDeviceId])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      engineRef.current?.destroy()
      engineRef.current = null
      initializedRef.current = false
    }
  }, [])

  return { engine, ready, error }
}
