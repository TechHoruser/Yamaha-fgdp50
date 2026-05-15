import React from 'react'
import type { AudioInputDevice } from '../../hooks/useAudioDevices'

interface AudioDeviceSelectorProps {
  devices: AudioInputDevice[]
  selectedId: string
  hasPermission: boolean
  engineReady: boolean
  engineError: string | null
  onSelect: (deviceId: string) => void
  onRequestPermission: () => void
  onRefresh: () => void
}

export const AudioDeviceSelector: React.FC<AudioDeviceSelectorProps> = ({
  devices,
  selectedId,
  hasPermission,
  engineReady,
  engineError,
  onSelect,
  onRequestPermission,
  onRefresh,
}) => {
  const statusColor = engineReady ? '#4caf50' : engineError ? '#f44336' : '#888'

  if (!hasPermission) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#888' }}>ENTRADA</span>
        <button
          onClick={onRequestPermission}
          style={{
            padding: '0.25rem 0.75rem',
            background: '#2a2a2a',
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: '0.7rem',
          }}
        >
          Autorizar micrófono
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.7rem', color: '#888' }}>ENTRADA</span>
      <select
        value={selectedId}
        onChange={e => onSelect(e.target.value)}
        style={{
          background: '#1e1e1e',
          border: '1px solid #444',
          borderRadius: '4px',
          color: '#e0e0e0',
          padding: '0.2rem 0.4rem',
          fontSize: '0.7rem',
          maxWidth: '220px',
        }}
      >
        {devices.map(d => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label}
          </option>
        ))}
      </select>
      <button
        onClick={onRefresh}
        title="Actualizar dispositivos"
        style={{
          background: 'transparent',
          border: '1px solid #444',
          borderRadius: '4px',
          color: '#888',
          cursor: 'pointer',
          fontSize: '0.85rem',
          lineHeight: 1,
          padding: '0.15rem 0.4rem',
        }}
      >
        ↻
      </button>
      <span title={engineError ?? (engineReady ? 'Audio listo' : 'Iniciando…')}
        style={{ fontSize: '0.8rem', color: statusColor }}>
        ●
      </span>
    </div>
  )
}
