import React, { useCallback, useEffect, useRef, useState } from 'react'
import { TrackPanel } from './ui/components/TrackPanel'
import { TransportBar } from './ui/components/TransportBar'
import { Metronome } from './ui/components/Metronome'
import { AudioDeviceSelector } from './ui/components/AudioDeviceSelector'
import { UpdateBanner } from './ui/components/UpdateBanner'
import { useLooperState } from './hooks/useLooperState'
import { useAudioDevices } from './hooks/useAudioDevices'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useAutoUpdate } from './hooks/useAutoUpdate'
import * as WailsApp from './wailsjs/go/main/App'

const DEFAULT_TRACK_NAMES: Record<number, string> = {
  1: 'Pista 1',
  2: 'Pista 2',
  3: 'Pista 3',
  4: 'Pista 4',
}

const App: React.FC = () => {
  const { state, dispatch, refresh, selectTrack } = useLooperState()
  const {
    devices, selectedId, setSelectedId, hasPermission,
    requestPermission, refresh: refreshDevices,
  } = useAudioDevices()
  const { engine, ready: engineReady, error: engineError } = useAudioEngine(selectedId)
  const { updateInfo, installing, error: updateError, install, dismiss } = useAutoUpdate()
  const [trackNames, setTrackNames] = useState<Record<number, string>>(DEFAULT_TRACK_NAMES)
  const [liveWaveform, setLiveWaveform] = useState<number[] | null>(null)
  const rafRef = useRef<number | null>(null)

  const recordingTrackId = engine?.recordingTrackId() ?? null
  const isRecording = engine?.isRecording() ?? false
  const isOverdubbing = engine?.getMode() === 'overdubbing'
  const isPlaying = engine?.isPlaying() ?? false
  const isMonitoring = engine?.isMonitoring() ?? false

  const globalState: 'idle' | 'playing' | 'recording' | 'overdubbing' =
    isOverdubbing ? 'overdubbing'
      : isRecording ? 'recording'
        : isPlaying ? 'playing'
          : 'idle'

  // Live waveform via requestAnimationFrame while recording
  useEffect(() => {
    if (!isRecording || !engine) {
      setLiveWaveform(null)
      return
    }
    const bars = 80
    const animate = () => {
      const raw = engine.getTimeDomainData()
      if (raw) {
        const blockSize = Math.floor(raw.length / bars)
        if (blockSize > 0) {
          const data = Array.from({ length: bars }, (_, i) => {
            let max = 0
            const start = i * blockSize
            for (let j = 0; j < blockSize; j++) {
              const v = Math.abs((raw[start + j] - 128) / 128)
              if (v > max) max = v
            }
            return max
          })
          setLiveWaveform(data)
        }
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isRecording, engine])

  const handleSelectTrack = (id: number) => selectTrack(id)

  const handleMuteTrack = useCallback(async (id: number) => {
    const wasMuted = state.tracks.find((t) => t.id === id)?.muted ?? false
    engine?.setMuted(id, !wasMuted)
    try {
      await WailsApp.SelectTrack(id)
      await WailsApp.MuteActiveTrack()
      await refresh()
    } catch { /* Wails unavailable */ }
  }, [engine, refresh, state.tracks])

  const handleVolumeChange = (id: number, volume: number) =>
    engine?.setVolume(id, volume / 100)

  const handleNameChange = (id: number, name: string) =>
    setTrackNames((prev) => ({ ...prev, [id]: name }))

  // ── Transport handlers ────────────────────────────────────────────
  const handleRecord = useCallback(async () => {
    if (!engine) return
    if (engine.isRecording()) {
      engine.stopRecording()
      await dispatch('Stop')
    } else {
      engine.startRecording(state.activeTrack, 'fresh')
      await dispatch('Record')
    }
  }, [engine, dispatch, state.activeTrack])

  const handleOverdub = useCallback(async () => {
    if (!engine) return
    if (!engine.hasLoop(state.activeTrack)) return // nothing to overdub on
    if (engine.isRecording()) {
      engine.stopRecording()
      await dispatch('Stop')
    } else {
      // Make sure the track is playing so overdub mixes with current loop.
      if (!engine.isPlaying()) engine.playAll()
      engine.startRecording(state.activeTrack, 'overdub')
      await dispatch('Overdub')
    }
  }, [engine, dispatch, state.activeTrack])

  const handlePlay = useCallback(async () => {
    if (!engine) return
    if (engine.isPlaying()) {
      engine.stopAll()
    } else {
      engine.playAll()
    }
    await dispatch('Play')
  }, [engine, dispatch])

  const handleStop = useCallback(async () => {
    engine?.stopAll()
    await dispatch('Stop')
  }, [engine, dispatch])

  const handleUndo = useCallback(async () => {
    engine?.undoTrack(state.activeTrack)
    await dispatch('Undo')
  }, [engine, dispatch, state.activeTrack])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0d0d0d',
        color: '#e0e0e0',
        fontFamily: 'ui-monospace, "JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0 1rem',
          height: '46px',
          background: '#0a0a0a',
          borderBottom: '1px solid #1a1a1a',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '26px',
            height: '26px',
            background: '#f59e0b',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '0.9rem',
            color: '#000',
            flexShrink: 0,
          }}
        >
          F
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em' }}>
          FGDP LOOPER
        </span>
        <span style={{ fontSize: '0.75rem', color: '#3a3a3a' }}>
          · {state.tracks.length} pistas
        </span>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => engine?.toggleMonitoring()}
          disabled={!engine}
          title={isMonitoring ? 'Monitor activo: escuchas la entrada por los altavoces' : 'Activar monitor (cuidado con el feedback)'}
          style={{
            background: isMonitoring ? '#4a9fff22' : 'transparent',
            border: `1px solid ${isMonitoring ? '#4a9fff' : '#2a2a2a'}`,
            color: isMonitoring ? '#4a9fff' : '#666',
            borderRadius: '4px',
            padding: '0.25rem 0.6rem',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: engine ? 'pointer' : 'not-allowed',
            opacity: engine ? 1 : 0.4,
          }}
        >
          MONITOR
        </button>

        <AudioDeviceSelector
          devices={devices}
          selectedId={selectedId}
          hasPermission={hasPermission}
          engineReady={engineReady}
          engineError={engineError}
          onSelect={setSelectedId}
          onRequestPermission={requestPermission}
          onRefresh={refreshDevices}
        />
      </header>

      {updateInfo && (
        <UpdateBanner
          updateInfo={updateInfo}
          installing={installing}
          error={updateError}
          onInstall={install}
          onDismiss={dismiss}
        />
      )}

      {/* ── Help bar (visible while there's nothing recorded yet) ── */}
      {engineReady && !state.tracks.some((t) => engine?.hasLoop(t.id)) && (
        <div
          style={{
            padding: '0.4rem 1rem',
            background: '#111',
            borderBottom: '1px solid #1a1a1a',
            color: '#666',
            fontSize: '0.7rem',
            letterSpacing: '0.03em',
          }}
        >
          Selecciona una pista y pulsa <strong style={{ color: '#f44336' }}>REC</strong> para grabar.
          Vuelve a pulsar <strong style={{ color: '#f44336' }}>REC</strong> o <strong style={{ color: '#bbb' }}>STOP</strong> para terminar.
          Luego <strong style={{ color: '#4a9fff' }}>PLAY</strong> reproduce todas las pistas en loop.
        </div>
      )}

      {/* ── Track list ── */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {state.tracks.map((track) => {
          const isThisRecording = track.id === recordingTrackId
          const realWaveform = engine?.getWaveform(track.id) ?? null
          const hasLoop = engine?.hasLoop(track.id) ?? track.hasLoop
          return (
            <TrackPanel
              key={track.id}
              trackId={track.id}
              trackName={trackNames[track.id] ?? `Pista ${track.id}`}
              active={track.id === state.activeTrack}
              muted={track.muted}
              hasLoop={hasLoop}
              recording={isThisRecording}
              bpm={state.bpm}
              waveformData={isThisRecording ? liveWaveform : realWaveform}
              onSelect={() => handleSelectTrack(track.id)}
              onMute={() => handleMuteTrack(track.id)}
              onVolumeChange={(v) => handleVolumeChange(track.id, v)}
              onNameChange={(name) => handleNameChange(track.id, name)}
            />
          )
        })}

        <button
          disabled
          style={{
            display: 'block',
            width: '100%',
            padding: '0.6rem',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #1a1a1a',
            color: '#2e2e2e',
            fontSize: '0.75rem',
            cursor: 'not-allowed',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}
        >
          + Añadir pista
        </button>
      </main>

      {/* ── Transport footer ── */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 1rem',
          background: '#080808',
          borderTop: '1px solid #1a1a1a',
          flexShrink: 0,
        }}
      >
        <TransportBar
          globalState={globalState}
          onPlay={handlePlay}
          onRecord={handleRecord}
          onOverdub={handleOverdub}
          onStop={handleStop}
          onUndo={handleUndo}
        />
        <Metronome
          active={state.metronomeActive}
          bpm={state.bpm}
          onToggle={() => dispatch('ToggleMetronome')}
          onBpmChange={(bpm) => dispatch('SetBpm' as keyof typeof WailsApp, bpm)}
        />
      </footer>
    </div>
  )
}

export default App
