import { useEffect, useRef, useState } from 'react'
import { AudioEngine } from '../core/audio-engine'

export function useAudioEngine(deviceId: string) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const engineRef = useRef<AudioEngine | null>(null)

  useEffect(() => {
    if (!deviceId) return

    let cancelled = false

    const engine = new AudioEngine({ sampleRate: 44100, bufferSize: 256, inputDeviceId: deviceId })
    engine
      .init()
      .then(() => {
        if (cancelled) { engine.destroy(); return }
        engineRef.current = engine
        setReady(true)
        setError(null)
      })
      .catch(e => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Error al inicializar audio')
        setReady(false)
      })

    return () => {
      cancelled = true
      engineRef.current?.destroy()
      engineRef.current = null
      setReady(false)
    }
  }, [deviceId])

  return { engine: engineRef.current, ready, error }
}
