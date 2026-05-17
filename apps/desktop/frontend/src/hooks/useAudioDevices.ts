import { useState, useEffect, useCallback } from 'react'

export interface AudioInputDevice {
  deviceId: string
  label: string
}

export interface AudioOutputDevice {
  deviceId: string
  label: string
}

const OUTPUT_PREF_KEY = 'fgdp-looper.outputDeviceId'
const INPUT_PREF_KEY = 'fgdp-looper.inputDeviceId'

function pickFgdp<T extends { label: string; deviceId: string }>(devs: T[]): T | undefined {
  return devs.find(
    d =>
      d.label.toLowerCase().includes('fgdp') ||
      d.label.toLowerCase().includes('yamaha'),
  )
}

export function useAudioDevices() {
  const [devices, setDevices] = useState<AudioInputDevice[]>([])
  const [outputs, setOutputs] = useState<AudioOutputDevice[]>([])
  const [selectedId, setSelectedIdState] = useState<string>(
    () => localStorage.getItem(INPUT_PREF_KEY) ?? '',
  )
  const [selectedOutputId, setSelectedOutputIdState] = useState<string>(
    () => localStorage.getItem(OUTPUT_PREF_KEY) ?? '',
  )
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setSelectedId = useCallback((id: string) => {
    setSelectedIdState(id)
    try { localStorage.setItem(INPUT_PREF_KEY, id) } catch { /* storage blocked */ }
  }, [])
  const setSelectedOutputId = useCallback((id: string) => {
    setSelectedOutputIdState(id)
    try { localStorage.setItem(OUTPUT_PREF_KEY, id) } catch { /* storage blocked */ }
  }, [])

  const enumerate = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      const ins = all.filter(d => d.kind === 'audioinput')
      const outs = all.filter(d => d.kind === 'audiooutput')
      const granted = ins.some(d => d.label !== '')
      setHasPermission(granted)
      const mappedIn: AudioInputDevice[] = ins.map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Entrada de audio ${i + 1}`,
      }))
      const mappedOut: AudioOutputDevice[] = outs.map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Salida de audio ${i + 1}`,
      }))
      setDevices(mappedIn)
      setOutputs(mappedOut)
      if (granted) {
        setSelectedIdState(prev => {
          if (prev && mappedIn.some(d => d.deviceId === prev)) return prev
          const auto = pickFgdp(mappedIn)?.deviceId ?? mappedIn[0]?.deviceId ?? ''
          if (auto) {
            try { localStorage.setItem(INPUT_PREF_KEY, auto) } catch { /* ignore */ }
          }
          return auto
        })
        setSelectedOutputIdState(prev => {
          if (prev && mappedOut.some(d => d.deviceId === prev)) return prev
          // Default output ('') is always valid — let the browser pick.
          return prev
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

  return {
    devices,
    outputs,
    selectedId,
    selectedOutputId,
    setSelectedId,
    setSelectedOutputId,
    hasPermission,
    requestPermission,
    refresh: enumerate,
    error,
  }
}
