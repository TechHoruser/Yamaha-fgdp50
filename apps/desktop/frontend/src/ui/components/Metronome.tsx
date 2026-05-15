import React from 'react'

interface MetronomeProps {
  active?: boolean
  bpm?: number
  onToggle?: () => void
  onBpmChange?: (bpm: number) => void
}

export const Metronome: React.FC<MetronomeProps> = ({
  active = false,
  bpm = 120,
  onToggle,
  onBpmChange,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.5rem 1rem',
      background: '#1e1e1e',
      border: `1px solid ${active ? '#4caf50' : '#333'}`,
      borderRadius: '6px',
    }}
  >
    <button
      onClick={onToggle}
      style={{
        background: active ? '#4caf50' : '#2a2a2a',
        border: 'none',
        borderRadius: '4px',
        color: '#e0e0e0',
        padding: '0.25rem 0.5rem',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: 600,
      }}
    >
      METRO
    </button>
    <input
      type="number"
      value={bpm}
      onChange={(e) => onBpmChange?.(Number(e.target.value))}
      min={40}
      max={240}
      style={{
        width: '60px',
        background: '#121212',
        border: '1px solid #444',
        borderRadius: '4px',
        color: '#e0e0e0',
        padding: '0.25rem',
        textAlign: 'center',
        fontSize: '0.875rem',
      }}
    />
    <span style={{ fontSize: '0.75rem', color: '#888' }}>BPM</span>
  </div>
)
