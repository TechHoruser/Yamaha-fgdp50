import { useEffect, useRef, useState } from 'react'
import { LoopEngine } from '../core/audio-engine'

export function useAudioEngine(deviceId: string) {
  const engineRef = useRef<LoopEngine | null>(null)
  const [engine, setEngine] = useState<LoopEngine | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setVersion] = useState(0)

  useEffect(() => {
    if (!deviceId) return
    let cancelled = false
    const e = new LoopEngine()
    const unsubscribe = e.subscribe(() => setVersion((v) => v + 1))

    e.init({ sampleRate: 44100, inputDeviceId: deviceId })
      .then(() => {
        if (cancelled) { e.destroy(); return }
        engineRef.current = e
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
      engineRef.current = null
      setEngine(null)
      setReady(false)
      e.destroy()
    }
  }, [deviceId])

  return { engine, ready, error }
}
