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
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <button
      onClick={onToggle}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: 0,
        color: active ? '#4a9fff' : '#555',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}
    >
      <span style={{ fontSize: '0.85rem' }}>♪</span>
      METRO
    </button>

    <input
      type="number"
      value={bpm}
      onChange={(e) => onBpmChange?.(Number(e.target.value))}
      min={40}
      max={240}
      aria-label="BPM"
      style={{
        width: '52px',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: '#e0e0e0',
        fontSize: '0.85rem',
        fontWeight: 600,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        MozAppearance: 'textfield',
      } as React.CSSProperties}
    />

    <span style={{ fontSize: '0.7rem', color: '#444', fontWeight: 600 }}>BPM</span>

    <span style={{ fontSize: '0.7rem', color: '#444', letterSpacing: '0.05em' }}>
      COMPÁS 4/4
    </span>
  </div>
)
