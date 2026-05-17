import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Web MIDI API hook for the FGDP-50 (or any MIDI input device).
 *
 * The FGDP-50 is class-compliant USB-MIDI: each pad sends a Note On / Note Off
 * on channel 10 (drum channel). The kit & sound selection happens on the device
 * itself; the host only sees the MIDI notes. We surface those notes via the
 * onNote callback so the rest of the app can react (record trigger, sample
 * trigger, etc.) without coupling this hook to the looper.
 */

export interface MidiDevice {
  id: string
  name: string
  manufacturer: string
}

export interface MidiNoteEvent {
  /** MIDI note number (0-127). FGDP pads are typically 36-51. */
  note: number
  /** 1-16. The FGDP defaults to 10 (drum channel). */
  channel: number
  /** 0-127. 0 means "note off" even on a Note On message. */
  velocity: number
  type: 'noteon' | 'noteoff'
  /** Source device name for UI display. */
  deviceName: string
}

const MIDI_PREF_KEY = 'fgdp-looper.midiDeviceId'
// MIDI status byte high nibbles for note messages.
const NOTE_OFF = 0x80
const NOTE_ON = 0x90

interface UseMidiInputOptions {
  onNote?: (event: MidiNoteEvent) => void
}

export function useMidiInput({ onNote }: UseMidiInputOptions = {}) {
  const [devices, setDevices] = useState<MidiDevice[]>([])
  const [selectedId, setSelectedIdState] = useState<string>(
    () => localStorage.getItem(MIDI_PREF_KEY) ?? '',
  )
  const [supported, setSupported] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastNote, setLastNote] = useState<MidiNoteEvent | null>(null)

  const accessRef = useRef<MIDIAccess | null>(null)
  const handlerRef = useRef<typeof onNote>(onNote)
  handlerRef.current = onNote

  const setSelectedId = useCallback((id: string) => {
    setSelectedIdState(id)
    try { localStorage.setItem(MIDI_PREF_KEY, id) } catch { /* storage blocked */ }
  }, [])

  const refresh = useCallback(() => {
    const access = accessRef.current
    if (!access) return
    const list: MidiDevice[] = []
    access.inputs.forEach((input) => {
      list.push({
        id: input.id,
        name: input.name ?? 'MIDI input',
        manufacturer: input.manufacturer ?? '',
      })
    })
    setDevices(list)
    // Auto-pick the FGDP if nothing chosen yet.
    if (!selectedId) {
      const fgdp = list.find(
        (d) =>
          d.name.toLowerCase().includes('fgdp') ||
          d.name.toLowerCase().includes('yamaha'),
      )
      if (fgdp) setSelectedId(fgdp.id)
      else if (list.length) setSelectedId(list[0].id)
    } else if (!list.some((d) => d.id === selectedId)) {
      // Previously selected device disappeared — fall back.
      setSelectedId(list[0]?.id ?? '')
    }
  }, [selectedId, setSelectedId])

  // Request MIDI access once on mount.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      setSupported(false)
      setError('Web MIDI no soportado en este entorno')
      return
    }
    let cancelled = false
    navigator
      .requestMIDIAccess({ sysex: false })
      .then((access) => {
        if (cancelled) return
        accessRef.current = access
        access.onstatechange = () => refresh()
        setError(null)
        refresh()
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Permiso MIDI denegado')
      })
    return () => {
      cancelled = true
      const acc = accessRef.current
      if (acc) {
        acc.inputs.forEach((i) => { i.onmidimessage = null })
        acc.onstatechange = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Attach message handler to the selected input.
  useEffect(() => {
    const access = accessRef.current
    if (!access) return
    // Detach previous listeners.
    access.inputs.forEach((i) => { i.onmidimessage = null })
    if (!selectedId) return
    const input = access.inputs.get(selectedId)
    if (!input) return
    input.onmidimessage = (e: MIDIMessageEvent) => {
      const data = e.data
      if (!data || data.length < 2) return
      const status = data[0] & 0xf0
      const channel = (data[0] & 0x0f) + 1
      const note = data[1]
      const velocity = data[2] ?? 0
      let type: MidiNoteEvent['type'] | null = null
      if (status === NOTE_ON && velocity > 0) type = 'noteon'
      else if (status === NOTE_OFF || (status === NOTE_ON && velocity === 0)) type = 'noteoff'
      if (!type) return
      const evt: MidiNoteEvent = {
        note,
        channel,
        velocity,
        type,
        deviceName: input.name ?? 'MIDI',
      }
      setLastNote(evt)
      handlerRef.current?.(evt)
    }
  }, [selectedId])

  return {
    devices,
    selectedId,
    setSelectedId,
    supported,
    error,
    lastNote,
    refresh,
  }
}
