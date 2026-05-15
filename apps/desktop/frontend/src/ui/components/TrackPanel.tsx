import React, { useEffect, useMemo, useState } from 'react'

interface TrackPanelProps {
  trackId: number
  trackName: string
  active?: boolean
  muted?: boolean
  hasLoop?: boolean
  recording?: boolean
  bpm?: number
  waveformData?: number[] | null
  onSelect?: () => void
  onMute?: () => void
  onVolumeChange?: (volume: number) => void
  onNameChange?: (name: string) => void
}

const BARS_OPTIONS = ['1 bar', '2 bars', '4 bars', '8 bars', '16 bars', '32 bars']
const FAKE_BAR_COUNT = 80

function syntheticWaveform(trackId: number, count = FAKE_BAR_COUNT): number[] {
  return Array.from({ length: count }, (_, i) => {
    const a = Math.sin(trackId * 2.1 + i * 0.35) * 0.5 + 0.5
    const b = Math.sin(trackId * 1.3 + i * 0.72) * 0.3 + 0.7
    return Math.max(0.06, Math.min(1, a * b))
  })
}

function barsToSeconds(barsLabel: string, bpm: number): string {
  const n = parseInt(barsLabel, 10)
  if (!n) return '—'
  const secs = Math.round((n * 4 * 60) / bpm)
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const TrackPanel: React.FC<TrackPanelProps> = ({
  trackId,
  trackName,
  active = false,
  muted = false,
  hasLoop = false,
  recording = false,
  bpm = 120,
  waveformData = null,
  onSelect,
  onMute,
  onVolumeChange,
  onNameChange,
}) => {
  const [volume, setVolume] = useState(75)
  const [bars, setBars] = useState('4 bars')
  const synthetic = useMemo(() => syntheticWaveform(trackId), [trackId])

  // Push initial volume to the engine on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onVolumeChange?.(volume) }, [])

  const waveColor = trackId % 2 === 1 ? '#4a9fff' : '#f59e0b'
  const trackNum = String(trackId).padStart(2, '0')
  const waveform = waveformData && waveformData.length > 0 ? waveformData : synthetic
  // Normalise real audio waveforms (peaks often < 1)
  const peak = waveformData ? Math.max(0.01, ...waveformData) : 1
  const normalised = waveformData ? waveform.map((v) => v / peak) : waveform
  const duration = hasLoop ? barsToSeconds(bars, bpm) : '—'

  return (
    <div
      data-testid={`track-row-${trackId}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.55rem 1rem',
        background: active ? '#141e2e' : '#111',
        borderBottom: '1px solid #1c1c1c',
        cursor: 'pointer',
        opacity: muted ? 0.45 : 1,
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontSize: '0.65rem',
          color: active ? '#4a9fff' : '#3a3a3a',
          minWidth: '18px',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 700,
        }}
      >
        {trackNum}
      </span>

      <input
        aria-label={`Nombre pista ${trackId}`}
        value={trackName}
        onChange={(e) => onNameChange?.(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{
          width: '170px',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: active ? '#f0f0f0' : '#999',
          fontSize: '0.8rem',
          fontWeight: active ? 600 : 400,
          cursor: 'text',
          flexShrink: 0,
        }}
      />

      <button
        aria-label="Mute"
        aria-pressed={muted}
        onClick={(e) => { e.stopPropagation(); onMute?.() }}
        style={{
          width: '22px',
          height: '22px',
          background: muted ? '#f59e0b22' : 'transparent',
          border: `1px solid ${muted ? '#f59e0b' : '#333'}`,
          borderRadius: '3px',
          color: muted ? '#f59e0b' : '#555',
          fontSize: '0.6rem',
          fontWeight: 700,
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
      >
        M
      </button>

      <button
        aria-label="Solo"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '22px',
          height: '22px',
          background: 'transparent',
          border: '1px solid #333',
          borderRadius: '3px',
          color: '#555',
          fontSize: '0.6rem',
          fontWeight: 700,
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
      >
        S
      </button>

      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        aria-label="Volumen"
        onChange={(e) => {
          const v = Number(e.target.value)
          setVolume(v)
          onVolumeChange?.(v)
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '68px', accentColor: waveColor, flexShrink: 0 }}
      />
      <span
        style={{
          fontSize: '0.65rem',
          color: '#555',
          minWidth: '20px',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {volume}
      </span>

      <div
        data-testid="waveform-area"
        style={{
          flex: 1,
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {recording ? (
          <span
            data-testid="recording-status"
            style={{
              fontSize: '0.7rem',
              color: '#f44336',
              letterSpacing: '0.05em',
              animation: 'pulse 1s ease-in-out infinite',
            }}
          >
            ● grabando...
          </span>
        ) : hasLoop ? (
          <div
            data-testid="waveform-bars"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1px',
              width: '100%',
              height: '100%',
            }}
          >
            {normalised.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${Math.max(4, h * 100)}%`,
                  background: waveColor,
                  borderRadius: '1px',
                  minWidth: '1px',
                }}
              />
            ))}
          </div>
        ) : (
          <span
            data-testid="idle-status"
            style={{ fontSize: '0.7rem', color: '#3a3a3a', fontStyle: 'italic' }}
          >
            esperando grabación · pulsa{' '}
            <kbd
              style={{
                background: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '3px',
                padding: '0 4px',
                fontStyle: 'normal',
                color: '#666',
                fontSize: '0.65rem',
              }}
            >
              R
            </kbd>
          </span>
        )}
      </div>

      <span
        style={{
          fontSize: '0.65rem',
          color: '#555',
          minWidth: '38px',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {duration}
      </span>

      <select
        value={bars}
        onChange={(e) => setBars(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Compás"
        style={{
          background: '#161616',
          border: '1px solid #2a2a2a',
          borderRadius: '4px',
          color: '#666',
          fontSize: '0.65rem',
          padding: '0.2rem 0.3rem',
          width: '76px',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        {BARS_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
