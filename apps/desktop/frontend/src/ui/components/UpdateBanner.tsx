import React from 'react'
import type { UpdateInfo } from '../../hooks/useAutoUpdate'

interface UpdateBannerProps {
  updateInfo: UpdateInfo
  installing: boolean
  error: string | null
  onInstall: () => void
  onDismiss: () => void
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({
  updateInfo,
  installing,
  error,
  onInstall,
  onDismiss,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.4rem 0.75rem',
      background: '#0d2b0d',
      border: '1px solid #388e3c',
      borderRadius: '6px',
      fontSize: '0.72rem',
    }}
  >
    <span style={{ flex: 1, color: '#c8e6c9' }}>
      Nueva versión disponible:{' '}
      <strong style={{ color: '#69f0ae' }}>{updateInfo.latestVersion}</strong>
      <span style={{ color: '#666', marginLeft: '0.4rem' }}>
        (actual: {updateInfo.currentVersion})
      </span>
    </span>

    {error && <span style={{ color: '#ef9a9a' }}>{error}</span>}

    <button
      onClick={onInstall}
      disabled={installing}
      style={{
        background: installing ? '#2e7d32' : '#43a047',
        border: 'none',
        borderRadius: '4px',
        color: '#fff',
        cursor: installing ? 'wait' : 'pointer',
        fontWeight: 700,
        fontSize: '0.7rem',
        padding: '0.25rem 0.75rem',
        whiteSpace: 'nowrap',
      }}
    >
      {installing ? 'Descargando…' : 'Actualizar'}
    </button>

    <button
      onClick={onDismiss}
      style={{
        background: 'transparent',
        border: '1px solid #444',
        borderRadius: '4px',
        color: '#777',
        cursor: 'pointer',
        fontSize: '0.7rem',
        padding: '0.2rem 0.5rem',
      }}
    >
      Ignorar
    </button>
  </div>
)
