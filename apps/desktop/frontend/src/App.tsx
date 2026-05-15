import React from 'react'
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

const App: React.FC = () => {
  const { state, dispatch } = useLooperState()
  const { devices, selectedId, setSelectedId, hasPermission, requestPermission, refresh } =
    useAudioDevices()
  const { ready: engineReady, error: engineError } = useAudioEngine(selectedId)
  const { updateInfo, installing, error: updateError, install, dismiss } = useAutoUpdate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem', gap: '1rem' }}>
      {updateInfo && (
        <UpdateBanner
          updateInfo={updateInfo}
          installing={installing}
          error={updateError}
          onInstall={install}
          onDismiss={dismiss}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>FGDP LOOPER</h1>
        <AudioDeviceSelector
          devices={devices}
          selectedId={selectedId}
          hasPermission={hasPermission}
          engineReady={engineReady}
          engineError={engineError}
          onSelect={setSelectedId}
          onRequestPermission={requestPermission}
          onRefresh={refresh}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', flex: 1 }}>
        {state.tracks.map((track) => (
          <TrackPanel
            key={track.id}
            trackId={track.id}
            active={track.id === state.activeTrack}
            muted={track.muted}
            hasLoop={track.hasLoop}
            onClick={() => dispatch('SelectTrack', track.id)}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
      </div>
    </div>
  )
}

export default App
