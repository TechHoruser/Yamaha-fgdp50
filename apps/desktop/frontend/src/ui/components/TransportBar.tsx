import React from 'react'

interface TransportBarProps {
  globalState?: 'idle' | 'playing' | 'recording' | 'overdubbing'
  onPlay?: () => void
  onRecord?: () => void
  onOverdub?: () => void
  onStop?: () => void
  onUndo?: () => void
}

interface ButtonProps {
  label: string
  onClick?: () => void
  active?: boolean
  variant?: 'default' | 'danger' | 'accent'
}

const TransportButton: React.FC<ButtonProps> = ({ label, onClick, active, variant = 'default' }) => {
  const bg = active
    ? variant === 'danger' ? '#f44336' : '#4caf50'
    : '#2a2a2a'

  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        background: bg,
        color: '#e0e0e0',
        border: '1px solid #444',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </button>
  )
}

export const TransportBar: React.FC<TransportBarProps> = ({
  globalState = 'idle',
  onPlay,
  onRecord,
  onOverdub,
  onStop,
  onUndo,
}) => (
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <TransportButton label="PLAY/PAUSE" onClick={onPlay} active={globalState === 'playing'} />
    <TransportButton label="RECORD" onClick={onRecord} active={globalState === 'recording'} variant="danger" />
    <TransportButton label="OVERDUB" onClick={onOverdub} active={globalState === 'overdubbing'} />
    <TransportButton label="STOP" onClick={onStop} variant="danger" />
    <TransportButton label="UNDO" onClick={onUndo} />
  </div>
)
