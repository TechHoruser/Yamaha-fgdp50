import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { LoopEngine } from '../../core/audio-engine'

interface AudioMonitorModalProps {
  engine: LoopEngine | null
  inputDeviceName: string
  outputDeviceName: string
  onClose: () => void
}

// --- VU Meter ----------------------------------------------------------------

interface VuMeterProps {
  level: number     // 0–1 RMS
  peak: number      // 0–1 peak hold
  label: string
  color: string
}

const SEGMENTS = 20

function VuMeter({ level, peak, label, color }: VuMeterProps) {
  const filled = Math.round(level * SEGMENTS)
  const peakSeg = Math.min(SEGMENTS - 1, Math.round(peak * SEGMENTS))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
      <span style={{ fontSize: '0.6rem', color: '#666', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: '2px',
          height: '140px',
          justifyContent: 'flex-start',
        }}
      >
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const isActive = i < filled
          const isPeak = i === peakSeg && peak > 0.01
          const segColor = i > SEGMENTS * 0.85
            ? '#f44336'
            : i > SEGMENTS * 0.65
              ? '#f59e0b'
              : color
          return (
            <div
              key={i}
              style={{
                width: '20px',
                height: '5px',
                borderRadius: '1px',
                background: isPeak ? '#fff' : isActive ? segColor : '#222',
                transition: 'background 0.04s',
              }}
            />
          )
        })}
      </div>
      <span style={{ fontSize: '0.6rem', color: '#555', fontVariantNumeric: 'tabular-nums' }}>
        {level < 0.001 ? '—' : `-${Math.round(20 * Math.log10(Math.max(level, 0.0001))).toString().padStart(3, ' ')} dB`}
      </span>
    </div>
  )
}

// --- Modal body --------------------------------------------------------------

export const AudioMonitorModal: React.FC<AudioMonitorModalProps> = ({
  engine,
  inputDeviceName,
  outputDeviceName,
  onClose,
}) => {
  const [inputLevel, setInputLevel] = useState(0)
  const [outputLevel, setOutputLevel] = useState(0)
  const [inputPeak, setInputPeak] = useState(0)
  const [outputPeak, setOutputPeak] = useState(0)
  const [ctxState, setCtxState] = useState<string>('unknown')
  const [monitoring, setMonitoring] = useState(engine?.isMonitoring() ?? false)
  const [monitorVol, setMonitorVol] = useState(engine?.getMonitorVolume() ?? 1)
  const [testPlaying, setTestPlaying] = useState(false)
  const [sampleRate, setSampleRate] = useState(0)

  const inputPeakTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const outputPeakTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  // rAF loop — sample levels 60 fps while the modal is open.
  useEffect(() => {
    if (!engine) return
    const tick = () => {
      const inLvl = engine.getInputLevel()
      const outLvl = engine.getOutputLevel()
      setInputLevel(inLvl)
      setOutputLevel(outLvl)
      setCtxState(engine.getContextState())
      setTestPlaying(engine.isTestTonePlaying())
      setSampleRate(engine.getSampleRate())

      setInputPeak(prev => {
        if (inLvl >= prev) {
          if (inputPeakTimer.current) clearTimeout(inputPeakTimer.current)
          inputPeakTimer.current = setTimeout(() => setInputPeak(0), 1800)
          return inLvl
        }
        return prev
      })
      setOutputPeak(prev => {
        if (outLvl >= prev) {
          if (outputPeakTimer.current) clearTimeout(outputPeakTimer.current)
          outputPeakTimer.current = setTimeout(() => setOutputPeak(0), 1800)
          return outLvl
        }
        return prev
      })

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (inputPeakTimer.current) clearTimeout(inputPeakTimer.current)
      if (outputPeakTimer.current) clearTimeout(outputPeakTimer.current)
    }
  }, [engine])

  const handleResume = useCallback(async () => {
    await engine?.resumeContext()
    setCtxState(engine?.getContextState() ?? 'unknown')
  }, [engine])

  const handleMonitorToggle = useCallback(() => {
    if (!engine) return
    engine.toggleMonitoring()
    setMonitoring(engine.isMonitoring())
  }, [engine])

  const handleMonitorVol = useCallback((v: number) => {
    engine?.setMonitorVolume(v)
    setMonitorVol(v)
  }, [engine])

  const handleTestTone = useCallback(() => {
    if (!engine) return
    if (engine.isTestTonePlaying()) engine.stopTestTone()
    else engine.startTestTone(440)
    setTestPlaying(engine.isTestTonePlaying())
  }, [engine])

  const isSuspended = ctxState === 'suspended'
  const statusColor = ctxState === 'running' ? '#4caf50' : ctxState === 'suspended' ? '#f59e0b' : '#f44336'

  return (
    // Overlay
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      {/* Card */}
      <div
        style={{
          background: '#111',
          border: '1px solid #2a2a2a',
          borderRadius: '8px',
          padding: '1.5rem',
          minWidth: '420px',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
          color: '#e0e0e0',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em' }}>
            MONITOR DE AUDIO
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: '4px',
              color: '#888',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
              padding: '0.2rem 0.5rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Context state banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 0.8rem',
            background: isSuspended ? '#2a1f00' : '#0d1a0d',
            border: `1px solid ${isSuspended ? '#5a3a00' : '#1a3a1a'}`,
            borderRadius: '5px',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: statusColor }}>●</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.72rem', color: '#bbb' }}>
              AudioContext: <strong style={{ color: statusColor }}>{ctxState}</strong>
            </span>
            {sampleRate > 0 && (
              <span style={{ fontSize: '0.65rem', color: '#555', marginLeft: '0.75rem' }}>
                {sampleRate} Hz
              </span>
            )}
          </div>
          {isSuspended && (
            <button
              onClick={handleResume}
              style={{
                padding: '0.3rem 0.7rem',
                background: '#f59e0b22',
                border: '1px solid #f59e0b',
                borderRadius: '4px',
                color: '#f59e0b',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              REACTIVAR
            </button>
          )}
        </div>

        {/* VU meters */}
        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            alignItems: 'flex-end',
            padding: '0.75rem',
            background: '#0a0a0a',
            borderRadius: '6px',
            border: '1px solid #1e1e1e',
          }}
        >
          <VuMeter level={inputLevel} peak={inputPeak} label="ENTRADA" color="#4a9fff" />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              paddingBottom: '20px',
            }}
          >
            <div
              style={{
                fontSize: '0.6rem',
                color: '#444',
                letterSpacing: '0.04em',
                writingMode: 'vertical-rl',
              }}
            >
              {inputDeviceName.slice(0, 20) || 'sin dispositivo'}
            </div>
            <div style={{ color: '#333', fontSize: '0.8rem' }}>→</div>
            <div
              style={{
                fontSize: '0.6rem',
                color: '#444',
                letterSpacing: '0.04em',
                writingMode: 'vertical-rl',
              }}
            >
              {outputDeviceName.slice(0, 20) || 'predeterminado'}
            </div>
          </div>
          <VuMeter level={outputLevel} peak={outputPeak} label="SALIDA" color="#4caf50" />
        </div>

        {/* Monitor section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.65rem', color: '#666', letterSpacing: '0.08em' }}>
            ESCUCHA DE ENTRADA (MONITOR)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleMonitorToggle}
              aria-pressed={monitoring}
              style={{
                padding: '0.5rem 1.2rem',
                background: monitoring ? '#4a9fff22' : '#1a1a1a',
                border: `2px solid ${monitoring ? '#4a9fff' : '#333'}`,
                borderRadius: '5px',
                color: monitoring ? '#4a9fff' : '#888',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                transition: 'all 0.15s',
                minWidth: '90px',
              }}
            >
              {monitoring ? 'ON' : 'OFF'}
            </button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', color: '#555', minWidth: '20px' }}>
                {Math.round(monitorVol * 100)}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={monitorVol}
                onChange={(e) => handleMonitorVol(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#4a9fff' }}
                aria-label="Volumen del monitor"
              />
              <span style={{ fontSize: '0.6rem', color: '#555' }}>vol</span>
            </div>
          </div>
          {monitoring && (
            <p style={{ margin: 0, fontSize: '0.62rem', color: '#a86010', lineHeight: 1.4 }}>
              ⚠ Activo: estás escuchando la entrada por los altavoces. Usa auriculares para evitar feedback.
            </p>
          )}
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px solid #1e1e1e' }} />

        {/* Test tone */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#bbb', fontWeight: 600 }}>
              Tono de prueba (440 Hz)
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.62rem', color: '#555' }}>
              Verifica que la salida de audio funciona correctamente.
            </p>
          </div>
          <button
            onClick={handleTestTone}
            style={{
              padding: '0.45rem 0.9rem',
              background: testPlaying ? '#f59e0b22' : '#1a1a1a',
              border: `1px solid ${testPlaying ? '#f59e0b' : '#444'}`,
              borderRadius: '5px',
              color: testPlaying ? '#f59e0b' : '#bbb',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              minWidth: '80px',
            }}
          >
            {testPlaying ? '■ STOP' : '▶ PLAY'}
          </button>
        </div>

        {/* Device info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.4rem 1rem',
            padding: '0.6rem 0.75rem',
            background: '#0a0a0a',
            borderRadius: '5px',
            border: '1px solid #1a1a1a',
          }}
        >
          {[
            ['Entrada', inputDeviceName || '(sin permiso)'],
            ['Salida', outputDeviceName || 'Predeterminada del sistema'],
          ].map(([label, name]) => (
            <React.Fragment key={label}>
              <span style={{ fontSize: '0.6rem', color: '#555' }}>{label}</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  color: '#888',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={name}
              >
                {name}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
