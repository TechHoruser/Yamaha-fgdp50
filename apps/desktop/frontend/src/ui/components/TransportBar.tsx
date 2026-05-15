import React from 'react'

interface ButtonProps {
  label: string
  onClick?: () => void
  active?: boolean
}

const TransportButton: React.FC<ButtonProps> = ({ label, onClick, active }) => (
  <button
    onClick={onClick}
    style={{
      padding: '0.5rem 1rem',
      background: active ? '#4caf50' : '#2a2a2a',
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

export const TransportBar: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <TransportButton label="PLAY/PAUSE" />
      <TransportButton label="RECORD" />
      <TransportButton label="OVERDUB" />
      <TransportButton label="STOP" />
      <TransportButton label="UNDO" />
    </div>
  )
}
