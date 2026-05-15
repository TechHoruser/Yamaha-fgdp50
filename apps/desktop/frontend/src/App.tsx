import React, { useState } from 'react'
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
  const { state, dispatch, refresh } = useLooperState()
  const { devices, selectedId, setSelectedId, hasPermission, requestPermission, refresh: refreshDevices } =
    useAudioDevices()
  const { ready: engineReady, error: engineError } = useAudioEngine(selectedId)
  const { updateInfo, installing, error: updateError, install, dismiss } = useAutoUpdate()
  const [trackNames, setTrackNames] = useState<Record<number, string>>(DEFAULT_TRACK_NAMES)

  const handleSelectTrack = (id: number) => dispatch('SelectTrack', id)

  const handleMuteTrack = async (id: number) => {
    try {
      await WailsApp.SelectTrack(id)
      await WailsApp.MuteActiveTrack()
      await refresh()
    } catch {
      // Wails runtime unavailable
    }
  }

  const handleNameChange = (id: number, name: string) =>
    setTrackNames((prev) => ({ ...prev, [id]: name }))

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
        {/* Logo */}
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

      {/* ── Update banner ── */}
      {updateInfo && (
        <UpdateBanner
          updateInfo={updateInfo}
          installing={installing}
          error={updateError}
          onInstall={install}
          onDismiss={dismiss}
        />
      )}

      {/* ── Track list ── */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {state.tracks.map((track) => (
          <TrackPanel
            key={track.id}
            trackId={track.id}
            trackName={trackNames[track.id] ?? `Pista ${track.id}`}
            active={track.id === state.activeTrack}
            muted={track.muted}
            hasLoop={track.hasLoop}
            recording={track.id === state.activeTrack && state.globalState === 'recording'}
            bpm={state.bpm}
            onSelect={() => handleSelectTrack(track.id)}
            onMute={() => handleMuteTrack(track.id)}
            onNameChange={(name) => handleNameChange(track.id, name)}
          />
        ))}

        {/* Add track placeholder */}
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
          globalState={state.globalState}
          onPlay={() => dispatch('Play')}
          onRecord={() => dispatch('Record')}
          onOverdub={() => dispatch('Overdub')}
          onStop={() => dispatch('Stop')}
          onUndo={() => dispatch('Undo')}
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
