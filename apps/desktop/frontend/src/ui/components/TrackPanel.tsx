import React from 'react'

interface TrackPanelProps {
  trackId: number
  active?: boolean
  muted?: boolean
  hasLoop?: boolean
}

export const TrackPanel: React.FC<TrackPanelProps> = ({
  trackId,
  active = false,
  muted = false,
  hasLoop = false,
}) => {
  const borderColor = active ? '#4caf50' : '#333'
  const opacity = muted ? 0.4 : 1

  return (
    <div
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '1rem',
        opacity,
        background: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>TRACK {trackId}</span>
      <span style={{ fontSize: '0.75rem', color: '#888' }}>
        {hasLoop ? (muted ? 'MUTED' : 'PLAYING') : 'EMPTY'}
      </span>
    </div>
  )
}
