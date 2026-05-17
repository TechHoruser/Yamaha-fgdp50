import React from 'react'
import type { MidiDevice, MidiNoteEvent } from '../../hooks/useMidiInput'

interface MidiDeviceSelectorProps {
  devices: MidiDevice[]
  selectedId: string
  supported: boolean
  error: string | null
  lastNote: MidiNoteEvent | null
  onSelect: (id: string) => void
  onRefresh: () => void
}

export const MidiDeviceSelector: React.FC<MidiDeviceSelectorProps> = ({
  devices,
  selectedId,
  supported,
  error,
  lastNote,
  onSelect,
  onRefresh,
}) => {
  // Pulse the dot for ~200 ms after every note for visual feedback.
  const [pulse, setPulse] = React.useState(false)
  React.useEffect(() => {
    if (!lastNote) return
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 200)
    return () => clearTimeout(t)
  }, [lastNote])

  if (!supported) {
    return (
      <div
        title={error ?? ''}
        style={{ fontSize: '0.65rem', color: '#666', letterSpacing: '0.05em' }}
      >
        MIDI N/D
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{ fontSize: '0.7rem', color: '#888' }}>MIDI</span>
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        aria-label="Dispositivo MIDI"
        disabled={devices.length === 0}
        style={{
          background: '#1e1e1e',
          border: '1px solid #444',
          borderRadius: '4px',
          color: '#e0e0e0',
          padding: '0.2rem 0.4rem',
          fontSize: '0.7rem',
          maxWidth: '160px',
        }}
      >
        {devices.length === 0 && <option value="">Sin dispositivos</option>}
        {devices.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <button
        onClick={onRefresh}
        title="Refrescar MIDI"
        style={{
          background: 'transparent',
          border: '1px solid #444',
          borderRadius: '4px',
          color: '#888',
          cursor: 'pointer',
          fontSize: '0.8rem',
          lineHeight: 1,
          padding: '0.15rem 0.4rem',
        }}
      >
        ↻
      </button>
      <span
        title={
          lastNote
            ? `Nota ${lastNote.note} vel ${lastNote.velocity} ch ${lastNote.channel}`
            : 'Esperando notas MIDI'
        }
        style={{
          fontSize: '0.8rem',
          color: pulse ? '#4caf50' : devices.length ? '#666' : '#444',
          transition: 'color 0.15s',
        }}
      >
        ●
      </span>
    </div>
  )
}
