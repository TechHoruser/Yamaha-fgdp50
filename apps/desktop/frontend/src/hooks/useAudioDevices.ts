import { useState, useEffect, useCallback } from 'react'

export interface AudioInputDevice {
  deviceId: string
  label: string
}

export function useAudioDevices() {
  const [devices, setDevices] = useState<AudioInputDevice[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enumerate = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      const inputs = all.filter(d => d.kind === 'audioinput')
      const granted = inputs.some(d => d.label !== '')
      setHasPermission(granted)
      const mapped: AudioInputDevice[] = inputs.map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Entrada de audio ${i + 1}`,
      }))
      setDevices(mapped)
      if (granted) {
        setSelectedId(prev => {
          if (prev && mapped.some(d => d.deviceId === prev)) return prev
          const fgdp = mapped.find(
            d =>
              d.label.toLowerCase().includes('fgdp') ||
              d.label.toLowerCase().includes('yamaha'),
          )
          return fgdp?.deviceId ?? mapped[0]?.deviceId ?? ''
        })
      }
    } catch {
      setError('No se pueden listar los dispositivos de audio')
    }
  }, [])

  const requestPermission = useCallback(async () => {
    try {
      // A brief getUserMedia call grants labels to subsequent enumerateDevices results.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      stream.getTracks().forEach(t => t.stop())
      setError(null)
      await enumerate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Permiso denegado')
    }
  }, [enumerate])

  useEffect(() => {
    enumerate()
    navigator.mediaDevices.addEventListener('devicechange', enumerate)
    return () => navigator.mediaDevices.removeEventListener('devicechange', enumerate)
  }, [enumerate])

  return { devices, selectedId, setSelectedId, hasPermission, requestPermission, refresh: enumerate, error }
}
