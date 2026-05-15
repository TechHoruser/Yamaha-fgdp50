import React from 'react'

interface TransportBarProps {
  globalState?: 'idle' | 'playing' | 'recording' | 'overdubbing'
  onPlay?: () => void
  onRecord?: () => void
  onOverdub?: () => void
  onStop?: () => void
  onUndo?: () => void
}

interface TransportButtonProps {
  icon: string
  label: string
  onClick?: () => void
  active?: boolean
  activeColor?: string
  pulse?: boolean
}

const TransportButton: React.FC<TransportButtonProps> = ({
  icon,
  label,
  onClick,
  active = false,
  activeColor = '#4a9fff',
  pulse = false,
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.45rem 0.85rem',
      background: active ? `${activeColor}22` : 'transparent',
      color: active ? activeColor : '#bbb',
      border: `1px solid ${active ? activeColor : '#2e2e2e'}`,
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      transition: 'border-color 0.1s, color 0.1s',
      animation: pulse ? 'pulse 1s ease-in-out infinite' : undefined,
    }}
  >
    <span style={{ fontSize: '0.75rem' }}>{icon}</span>
    {label}
  </button>
)

export const TransportBar: React.FC<TransportBarProps> = ({
  globalState = 'idle',
  onPlay,
  onRecord,
  onOverdub,
  onStop,
  onUndo,
}) => (
  <div style={{ display: 'flex', gap: '0.4rem' }}>
    <TransportButton
      icon="▶"
      label="PLAY"
      onClick={onPlay}
      active={globalState === 'playing'}
      activeColor="#4a9fff"
    />
    <TransportButton
      icon="●"
      label="REC"
      onClick={onRecord}
      active={globalState === 'recording'}
      pulse={globalState === 'recording'}
      activeColor="#f44336"
    />
    <TransportButton
      icon="⊕"
      label="OVERDUB"
      onClick={onOverdub}
      active={globalState === 'overdubbing'}
      pulse={globalState === 'overdubbing'}
      activeColor="#f59e0b"
    />
    <TransportButton
      icon="■"
      label="STOP"
      onClick={onStop}
    />
    <TransportButton
      icon="↩"
      label="UNDO"
      onClick={onUndo}
    />
  </div>
)
